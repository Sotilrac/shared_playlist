#!/usr/bin/env python
# encoding: utf-8
"""
almusic.py

Created by Aldebaran Boston Studio.
"""
import qi
import os
import string
import grooveshark
import logging as logger



@qi.multiThreaded()
class ALMusic:
    """Class: ALMusic

    Pump up the jam

    IMPORTANT: ALMusic module is based on qimessaging, therefore
    session.service must be used (instead of ALProxy).

    """

    def __init__(self, session):
        self.session = session
        logger.basicConfig(filename='ALAdvancedTouch.log', level=logger.DEBUG)
        self.logger = logger
        self.memory = self.session.service('ALMemory')
        self.audio_player = self.session.service('ALAudioPlayer')

        ## Initialize cache directory where songs will be temporarily stored.

        self.cache_path = os.path.expanduser('~/.almusic_cache')
        if not os.path.isdir(self.cache_path):
            os.mkdir(self.cache_path)

        self.client = grooveshark.Client()
        self.client.init()
        self.song_queue = []
        self.previous_songs = []
        self.player_ids = []
        self.playing = False

    def play_song(self, search_string):
        """
        Searches for a song and plays it
        """
        self.song_queue = []
        self.enqueue_song(search_string)
        self.play_queue()

    def enqueue_song(self, search_string):
        """
        Add song to the queue
        """
        song_search = self.client.search(search_string)
        try:
            song = song_search.next()
            self.song_queue.append(self._fetch_song(song))
            # self.song_queue.append(song.stream.url)
            return True
        except StopIteration:
            return False

    def play_queue(self):
        """
        plays the queue until it is empty
        """
        self.playing = True
        while self.song_queue and self.playing:
            self.pop_queue()


    def pop_queue(self):
        """
        plays first item in the queue
        """
        file_path = self.song_queue.pop(0)
        self.previous_songs.append(file_path)
        self.audio_player.playFile(file_path)
        #player_id = self.audio_player.post.playFile(file_path)
        #self.player_ids.append(player_id)
        #self.audio_player.wait(player_id, 0)
        return file_path

    def enqueue_next(self, search_string):
        """
        Adds song to the beginning of the queue
        """
        song_search = self.client.search(search_string)
        try:
            song = song_search.next()
            self.song_queue.insert(0, self._fetch_song(song))
            return True
        except StopIteration:
            return False

    def clear_queue(self):
        """
        Stops music and clears queue
        """
        self.song_queue = []

    def play_mix_artist(self, search_string):
        """
        Searches for songs by artist and plays them. Not implemented :(
        """
        pass

    def play_mix_genre(self, search_string):
        """
        Searches for songs by genre and plays them. Not implemented :(
        """
        pass

    def play_mix_album(self, search_string):
        """
        Searches for songs by album and plays them. Not implemented :(
        """
        pass

    def stop(self):
        """
        Stops curently playing song or mix.
        """
        self.next()

    def stop_all(self):
        """
        Empties the queue and stops playing music
        """
        self.clear_queue()
        self.stop()

    def pause(self):
        """
        pauses current song or mix. Not implemented :(
        """
        pass

    def resume(self):
        """
        Resumes current song or mix. Not implemented :(
        """
        pass

    def next(self):
        """
        Plays next song in current mix. Same as stop for the moment
        """
        self.audio_player.stopAll()

    def previous(self):
        """
        Plays next song in current mix. Not implemented :(
        """
        pass

    def _clear_cache(self):
        """
        Clears the song cache. Not implemented :(
        """
        pass

    def _fetch_song(self, song):
        """
        Downloads a song and returns a path gto a file.
        """
        song_file_name = _make_file_name(song)

        song_path = os.path.join(self.cache_path,
                                 song_file_name)

        if not os.path.exists(song_path):
            with open(song_path, 'w') as song_file:
                data = song.safe_download()
                song_file.write(data)
        return song_path


    def _maintain_cache(self, max_size):
        """
        Removes old files form the cache until they cache size is less than or
        equal to the max_size.
        """
        pass

def _make_file_name(song):
    """
    returns a valid file name for a song object
    """
    valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)
    fname = '{} - {}.mp3'.format(song.name.encode('utf8', 'replace'),
                                 song.artist.name.encode('utf8', 'replace'))
    fname = ''.join(c for c in fname if c in valid_chars)

    return fname
        
def register_as_service(service_class, robot_ip="127.0.1"):
    """
    Register service
    """
    session = qi.Session()
    session.connect("tcp://%s:9559" % robot_ip)
    service_name = service_class.__name__
    instance = service_class(session)
    try:
        session.registerService(service_name, instance)
        print 'Successfully registered service: {}'.format(service_name)
    except RuntimeError:
        print '{} already registered, attempt re-register'.format(service_name)
        for info in session.services():
            try:
                if info['name'] == service_name:
                    session.unregisterService(info['serviceId'])
                    print "Unregistered {} as {}".format(service_name,
                                                         info['serviceId'])
                    break
            except (KeyError, IndexError):
                pass
        session.registerService(service_name, instance)
        print 'Successfully registered service: {}'.format(service_name)


def main():
    """
    Registers service
    """
    register_as_service(ALMusic)
    app = qi.Application()
    app.run()

if __name__ == "__main__":
    main()
