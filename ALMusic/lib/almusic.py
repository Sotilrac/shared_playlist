#!/usr/bin/env python
# encoding: utf-8
"""
almusic.py

Created by Aldebaran Boston Studio.
"""
import qi
import os
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

    def play_song(self, search_string):
        """
        Searches for a song and plays it
        """
        song_search = self.client.search(search_string)
        try:
            song = song_search.next()
            if song:
                song_file_name = '{} - {}.mp3'.format(song.name.encode('utf8', 'replace'),
                                                      song.artist.name.encode('utf8', 'replace'))

                song_path = os.path.join(self.cache_path,
                                         song_file_name)

                if not os.path.isdir(song_path):
                    with open(song_path, 'w') as song_file:
                        data = song.safe_download()
                        song_file.write(data)
                self.audio_player.playFile(song_path)
                return True
        except StopIteration:
            return False


    def play_mix_artist(self, search_string):
        """
        Searches for songs by artist and plays them
        """
        pass

    def play_mix_genre(self, search_string):
        """
        Searches for songs by genre and plays them
        """
        pass

    def play_mix_album(self, search_string):
        """
        Searches for songs by album and plays them
        """
        pass

    def stop(self):
        """
        Stops curently playing song or mix
        """
        self.audio_player.stopAll()

    def pause(self):
        """
        pauses current song or mix.
        """
        pass

    def resume(self):
        """
        Resumes current song or mix.
        """
        pass

    def next(self):
        """
        Plays next song in current mix
        """
        pass

    def previous(self):
        """
        Plays next song in current mix
        """
        pass

    def _clear_cache(self):
        """
        Clears the song cache
        """
        pass

    def _maintain_cache(self, max_size):
        """
        Removes old files form the cache until they cache size is less than or
        equal to the max_size.
        """
        pass

        
def register_as_service(service_class, robot_ip="127.0.1"):
    session = qi.Session()
    session.connect("tcp://%s:9559" % robot_ip)
    service_name = service_class.__name__
    instance = service_class(session)
    try:
        session.registerService(service_name, instance)
        print("Successfully registered service: {}".format(service_name))
    except RuntimeError:
        print("{} already registered, attempt re-register".format(service_name))
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
        print("Successfully registered service: {}".format(service_name))


def main():
    """
    Registers service
    """
    register_as_service(ALMusic)
    app = qi.Application()
    app.run()

if __name__ == "__main__":
    main()
