/*
 * Copyright 2018 Jiří Janoušek <janousek.jiri@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

(function (Nuvola) {
  const C_ = Nuvola.Translate.pgettext
  const PlaybackState = Nuvola.PlaybackState
  const PlayerAction = Nuvola.PlayerAction

  const ACTION_LIKE = 'like'
  const ACTION_DISLIKE = 'dislike'

  const player = Nuvola.$object(Nuvola.MediaPlayer)
  const WebApp = Nuvola.$WebApp()

  WebApp._onInitAppRunner = function (emitter) {
    Nuvola.WebApp._onInitAppRunner.call(this, emitter)
    Nuvola.actions.addAction('playback', 'win', ACTION_LIKE, C_('Action', 'Like song'),
      null, null, null, null)
    Nuvola.actions.addAction('playback', 'win', ACTION_DISLIKE, C_('Action', 'Dislike song'),
      null, null, null, null)
  }

  WebApp._onInitWebWorker = function (emitter) {
    Nuvola.WebApp._onInitWebWorker.call(this, emitter)

    const state = document.readyState
    if (state === 'interactive' || state === 'complete') {
      this._onPageReady()
    } else {
      document.addEventListener('DOMContentLoaded', this._onPageReady.bind(this))
    }
  }

  WebApp._onPageReady = function () {
    player.addExtraActions([ACTION_LIKE, ACTION_DISLIKE])
    Nuvola.actions.connect('ActionActivated', this)

    this.update()
  }

  WebApp.update = function () {
    const elms = this._getElements()
    const track = {
      title: Nuvola.queryText('#song_name'),
      artist: Nuvola.queryText('#messages_box_artist_name'),
      album: null,
      artLocation: 'https://mentor.fm//images/radio_scontornata_650.png',
      rating: null
    }
    let state
    if (elms.play) {
      state = PlaybackState.PAUSED
    } else if (elms.pause) {
      state = PlaybackState.PLAYING
    } else {
      state = PlaybackState.UNKNOWN
    }

    let volume = 1.0
    if (elms.volumebar) {
      const width = elms.volumebar.firstChild.style.width
      if (width.endsWith('%')) {
        volume = width.substring(0, width.length - 1) / 100
      }
    }

    player.setTrack(track)
    player.setPlaybackState(state)
    player.updateVolume(volume)

    player.setCanGoPrev(false)
    player.setCanGoNext(elms.next)
    player.setCanPlay(elms.play)
    player.setCanPause(elms.pause)
    player.setCanChangeVolume(!!elms.volumebar)
    Nuvola.actions.updateEnabledFlag(ACTION_LIKE, !!elms.like)
    Nuvola.actions.updateEnabledFlag(ACTION_DISLIKE, !!elms.dislike)

    setTimeout(this.update.bind(this), 500)
  }

  WebApp._onActionActivated = function (emitter, name, param) {
    const elms = this._getElements()
    switch (name) {
      case PlayerAction.TOGGLE_PLAY:
        if (elms.play) {
          Nuvola.clickOnElement(elms.play)
        } else {
          Nuvola.clickOnElement(elms.pause)
        }
        break
      case PlayerAction.PLAY:
        Nuvola.clickOnElement(elms.play)
        break
      case PlayerAction.PAUSE:
      case PlayerAction.STOP:
        Nuvola.clickOnElement(elms.pause)
        break
      case PlayerAction.NEXT_SONG:
        Nuvola.clickOnElement(elms.next)
        break
      case PlayerAction.CHANGE_VOLUME:
        Nuvola.clickOnElement(elms.volumebar, param, 0.5)
        break
      case ACTION_LIKE:
        Nuvola.clickOnElement(elms.like)
        break
      case ACTION_DISLIKE:
        Nuvola.clickOnElement(elms.dislike)
        break
    }
  }

  WebApp._getElements = function () {
    // Interesting elements
    const elms = {
      play: document.getElementById('play-button'),
      pause: document.getElementById('pause-button'),
      next: document.getElementById('next_song'),
      volumebar: document.getElementById('volume_bar'),
      like: document.getElementById('like'),
      dislike: document.getElementById('dislike')
    }

    // Ignore disabled buttons
    for (const key in elms) {
      const elm = elms[key]
      if (!elm || elm.disabled || elm.style.display === 'none' || elm.style.visibility === 'hidden') {
        elms[key] = null
      }
    }

    // Like button can be clicked only once per song
    if (elms.like && elms.like.classList.contains('icondisabled')) {
      elms.like = null
    }
    return elms
  }

  WebApp.start()
})(this) // function(Nuvola)
