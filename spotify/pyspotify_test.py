#!/usr/bin/python
"""pyspotify_test.py


test basic functionality for pyspotify"""
from __future__ import unicode_literals

import sys
import time
import threading
import spotify


global end_of_track

def main(args):

    # Assuming a spotify_appkey.key in the current dir:
    session = spotify.Session()
    loop = spotify.EventLoop(session)
    loop.start()
    audio = spotify.AlsaSink(session)

    end_of_track = threading.Event()
    def on_end_of_track():
        end_of_track.set()

    session.on(spotify.SessionEvent.END_OF_TRACK, on_end_of_track)
    # Logging in
    try:
        session.login(args[0], args[1], remember_me=True)
    except IndexError:
        raise Exception('Invalid arguments. Call the program with user name \
                         and password as arguments')

    # Waisitng while session connects
    while session.connection.state != spotify.ConnectionState.LOGGED_IN:
        session.process_events()
        time.sleep(0.1)
    # search
    try:
        term = args[2]
    except IndexError:
        term = 'queen'

    search = session.search(term)
    search.load()
    print ('Searched "{}".\nFound: {} artists, {} ' +
           'albums, {} tracks, {} playlists').format(term,
                                                     search.artist_total,
                                                     search.album_total,
                                                     search.track_total,
                                                     search.playlist_total)

    # Get first artist:
    artist = search.artists[0].load()
    browser = artist.browse()
    browser.load()
    print '{} {} tracks available'.format(len(browser.tracks), artist.name)

    # Get first Track
    track = search.tracks[0].load()
    print '{} by {} from {}.\nLink: {}\n\n'.format(track.name,
                                                   track.artists[0].name,
                                                   track.album.name,
                                                   track.link)

    # Connect an audio sink
    # session.player.prefetch(track)
    # track = session.get_track('spotify:track:0CaHZUniQtDRZleX6XK9p7').load()
    session.player.load(track)
    session.player.play()

    # Wait for playback to complete or Ctrl+C
    try:
        while not end_of_track.wait(0.1):
            pass
    except KeyboardInterrupt:
        pass
    session.logout()


if __name__ == '__main__':
    main(sys.argv[1:])
