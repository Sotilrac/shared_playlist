#!/usr/bin/env python
# encoding: utf-8
"""almusic.py

Created by Aldebaran Boston Studio.
"""
import qi
import os
import string
import time
import functools
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

        ## Connect services
        self.serv_timeout = 300 * 1000000
        self.run = True
        self.memory = None
        self.audio_player = None
        self.tts = None
        self._connect_services()
        

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
        self.radio_names = None
        self._init_radio_names()
        self.periodic = None
        self.say_song_name = False

    def _connect_services(self):
        """Attempt to get references to other services (avoid race conditions).
        """

        def timeout():
            """Give up connecting to services on timeout."""
            self.run = False
        qi.async(timeout, delay=self.serv_timeout)

        while self.run:
            try:
                self.memory = self.session.service('ALMemory')
                self.audio_player = self.session.service('ALAudioPlayer')
                self.tts = self.session.service('ALTextToSpeech')
                break
            except RuntimeError as err:
                time.sleep(1)
                self.logger.warning('missing:\n {}'.format(err))

    def play(self, search_string):
        """Searches for a song and plays it."""
        self.song_queue = []
        self.enqueue(search_string)
        self.play_queue()

    def enqueue(self, search_string):
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
        """Plays the queue until it is empty."""
        self.playing = True
        while self.song_queue and self.playing:
            self.pop_queue()

    def play_radio(self, station):
        """Plays a radio station ad nauseam."""
        if station == 'popular':
            radio = self.client.popular()
        else:
            try:
                radio = self.client.radio(self.radio_names[station])
            except KeyError:
                self.logger.warning('Invalid station name: {}'.format(station))
                return False

        self.clear_queue()
        try:
            song = radio.song
            self.song_queue.append(self._fetch_song(song))
            qi.async(self.play_queue)
            func = functools.partial(self._maintain_radio_queue,
                                     song_generator=radio,
                                     count=3
                                     )
            self.periodic = qi.PeriodicTask()
            self.periodic.setCallback(func)
            self.periodic.setUsPeriod(15000000)
            self.periodic.start(True)
            return True
        except StopIteration:
            return False


    def _maintain_radio_queue(self, song_generator, count):
        """Maintains the queue to be of length "count". """
        while len(self.song_queue) < count:
            try:
                song = song_generator.song
                self.song_queue.append(self._fetch_song(song))  
            except StopIteration:
                self.periodic.stop()


    def pop_queue(self):
        """Plays first item in the queue."""
        file_path = self.song_queue.pop(0)
        self.previous_songs.append(file_path)
        self.audio_player.playFile(file_path)
        _delete_file(file_path)
        return file_path

    def enqueue_next(self, search_string):
        """Adds song to the beginning of the queue."""
        song_search = self.client.search(search_string)
        try:
            song = song_search.next()
            self.song_queue.insert(0, self._fetch_song(song))
            return True
        except StopIteration:
            return False

    def clear_queue(self):
        """Clears queue."""
        self.song_queue = []

    def next(self):
        """Stops curently playing song or radio."""
        self.audio_player.stopAll()

    def stop(self):
        """Empties the queue and stops playing music."""
        if self.periodic:
            self.periodic.stop()
        self.clear_queue()
        self.next()

    def pause(self):
        """Pauses current song or radio. Not implemented :( """
        pass

    def resume(self):
        """Resumes current song or radio. Not implemented :( """
        pass

    def previous(self):
        """Plays next song in current mix. Not implemented :( """
        pass

    def enable_say_song_name(self):
        """ALMusic uses ALTextToSpeech to enunciate the song name and artist
        before playing it.
        """
        self.say_song_name = True

    def disable_say_song_name(self):
        """ALMusic does not use ALTextToSpeech to enunciate the song name and
        artist before playing it."""
        self.say_song_name = False

    def _clear_cache(self):
        """Clears the song cache. Not implemented :( ."""
        for song in os.listdir(self.cache_path):
            f_path = os.path.join(self.cache_path, song)
            if os.path.isfile(f_path):
                os.unlink(f_path)

    def _fetch_song(self, song):
        """Downloads a song and returns a path gto a file."""
        song_file_name = _make_file_name(song)

        song_path = os.path.join(self.cache_path,
                                 song_file_name)

        if not os.path.exists(song_path):
            with open(song_path, 'w') as song_file:
                data = song.safe_download()
                song_file.write(data)
        return song_path


    def _maintain_cache(self, max_size):
        """Removes old files form the cache until they cache size is less than
        or equal to the max_size.
        """
        pass

    def get_radio_stations(self):
        """Returns the possible radio station names."""
        return self.radio_names.keys()

    def _init_radio_names(self):
        """Sets the radio station names."""
        self.radio_names = {
            'k pop': grooveshark.Radio.GENRE_KPOP,
            'chinese': grooveshark.Radio.GENRE_CHINESE,
            'ragga': grooveshark.Radio.GENRE_RAGGA,
            'dance': grooveshark.Radio.GENRE_DANCE,
            'orchestra': grooveshark.Radio.GENRE_ORCHESTRA,
            'neo folk': grooveshark.Radio.GENRE_NEOFOLK,
            'post rock': grooveshark.Radio.GENRE_POSTROCK,
            'meditation': grooveshark.Radio.GENRE_MEDITATION,
            'synthpop': grooveshark.Radio.GENRE_SYNTHPOP,
            'bhangra': grooveshark.Radio.GENRE_BHANGRA,
            'samba': grooveshark.Radio.GENRE_SAMBA,
            'acapella': grooveshark.Radio.GENRE_ACAPELLA,
            'turkish': grooveshark.Radio.GENRE_TURKISH,
            'jazz blues': grooveshark.Radio.GENRE_JAZZBLUES,
            'ska': grooveshark.Radio.GENRE_SKA,
            'symphonic metal': grooveshark.Radio.GENRE_SYMPHONICMETAL,
            'dance hall': grooveshark.Radio.GENRE_DANCEHALL,
            'mpb': grooveshark.Radio.GENRE_MPB,
            'beat': grooveshark.Radio.GENRE_BEAT,
            'rnb': grooveshark.Radio.GENRE_RNB,
            'jazz': grooveshark.Radio.GENRE_JAZZ,
            'acid jazz': grooveshark.Radio.GENRE_ACIDJAZZ,
            'underground': grooveshark.Radio.GENRE_UNDERGROUND,
            'psychobilly': grooveshark.Radio.GENRE_PSYCHOBILLY,
            'desi': grooveshark.Radio.GENRE_DESI,
            'world': grooveshark.Radio.GENRE_WORLD,
            'indiefolk': grooveshark.Radio.GENRE_INDIEFOLK,
            'banda': grooveshark.Radio.GENRE_BANDA,
            'jpop': grooveshark.Radio.GENRE_JPOP,
            'progressive': grooveshark.Radio.GENRE_PROGRESSIVE,
            'black metal': grooveshark.Radio.GENRE_BLACKMETAL,
            'ska punk': grooveshark.Radio.GENRE_SKAPUNK,
            'emo': grooveshark.Radio.GENRE_EMO,
            'blues rock': grooveshark.Radio.GENRE_BLUESROCK,
            'disco': grooveshark.Radio.GENRE_DISCO,
            'opera': grooveshark.Radio.GENRE_OPERA,
            'hard style': grooveshark.Radio.GENRE_HARDSTYLE,
            '40s': grooveshark.Radio.GENRE_40S,
            'minimal': grooveshark.Radio.GENRE_MINIMAL,
            'rock': grooveshark.Radio.GENRE_ROCK,
            'acoustic': grooveshark.Radio.GENRE_ACOUSTIC,
            'gospel': grooveshark.Radio.GENRE_GOSPEL,
            'nu jazz': grooveshark.Radio.GENRE_NUJAZZ,
            'classical': grooveshark.Radio.GENRE_CLASSICAL,
            'house': grooveshark.Radio.GENRE_HOUSE,
            'dubstep': grooveshark.Radio.GENRE_DUBSTEP,
            'math rock': grooveshark.Radio.GENRE_MATHROCK,
            'blues': grooveshark.Radio.GENRE_BLUES,
            'vallenato': grooveshark.Radio.GENRE_VALLENATO,
            'folk': grooveshark.Radio.GENRE_FOLK,
            'christian rock': grooveshark.Radio.GENRE_CHRISTIANROCK,
            '90s': grooveshark.Radio.GENRE_90S,
            'heavy metal': grooveshark.Radio.GENRE_HEAVYMETAL,
            'tejano': grooveshark.Radio.GENRE_TEJANO,
            'electronica': grooveshark.Radio.GENRE_ELECTRONICA,
            'motown': grooveshark.Radio.GENRE_MOTOWN,
            'goa': grooveshark.Radio.GENRE_GOA,
            'soft rock': grooveshark.Radio.GENRE_SOFTROCK,
            'southern rock': grooveshark.Radio.GENRE_SOUTHERNROCK,
            'rb': grooveshark.Radio.GENRE_RB,
            'christmas': grooveshark.Radio.GENRE_CHRISTMAS,
            'disney': grooveshark.Radio.GENRE_DISNEY,
            'videogame': grooveshark.Radio.GENRE_VIDEOGAME,
            'noise': grooveshark.Radio.GENRE_NOISE,
            'christian': grooveshark.Radio.GENRE_CHRISTIAN,
            'bass': grooveshark.Radio.GENRE_BASS,
            'oldies': grooveshark.Radio.GENRE_OLDIES,
            'singer song writer': grooveshark.Radio.GENRE_SINGERSONGWRITER,
            'smooth jazz': grooveshark.Radio.GENRE_SMOOTHJAZZ,
            '70s': grooveshark.Radio.GENRE_70S,
            'techno': grooveshark.Radio.GENRE_TECHNO,
            'pagode': grooveshark.Radio.GENRE_PAGODE,
            'pop rock': grooveshark.Radio.GENRE_POPROCK,
            'screamo': grooveshark.Radio.GENRE_SCREAMO,
        'contemporary christian': grooveshark.Radio.GENRE_CONTEMPORARYCHRISTIAN,
            'downtempo': grooveshark.Radio.GENRE_DOWNTEMPO,
            'classic country': grooveshark.Radio.GENRE_CLASSICCOUNTRY,
            'soundtrack': grooveshark.Radio.GENRE_SOUNDTRACK,
            'oi': grooveshark.Radio.GENRE_OI,
            'christian metal': grooveshark.Radio.GENRE_CHRISTIANMETAL,
            'country': grooveshark.Radio.GENRE_COUNTRY,
            'thrash metal': grooveshark.Radio.GENRE_THRASHMETAL,
            'funky': grooveshark.Radio.GENRE_FUNKY,
            'punk rock': grooveshark.Radio.GENRE_PUNKROCK,
            'anime': grooveshark.Radio.GENRE_ANIME,
            'swing': grooveshark.Radio.GENRE_SWING,
            'classic rock': grooveshark.Radio.GENRE_CLASSICROCK,
            'post hardcore': grooveshark.Radio.GENRE_POSTHARDCORE,
            'experimental': grooveshark.Radio.GENRE_EXPERIMENTAL,
            'industrial': grooveshark.Radio.GENRE_INDUSTRIAL,
            'americana': grooveshark.Radio.GENRE_AMERICANA,
            'pop': grooveshark.Radio.GENRE_POP,
            'jesus': grooveshark.Radio.GENRE_JESUS,
            'alternativerock': grooveshark.Radio.GENRE_ALTERNATIVEROCK,
            'medieval': grooveshark.Radio.GENRE_MEDIEVAL,
            'texascountry': grooveshark.Radio.GENRE_TEXASCOUNTRY,
            'rave': grooveshark.Radio.GENRE_RAVE,
            'electronic': grooveshark.Radio.GENRE_ELECTRONIC,
            'powermetal': grooveshark.Radio.GENRE_POWERMETAL,
            'chanson': grooveshark.Radio.GENRE_CHANSON,
            'dnb': grooveshark.Radio.GENRE_DNB,
            'crunk': grooveshark.Radio.GENRE_CRUNK,
            'dub': grooveshark.Radio.GENRE_DUB,
            'grime': grooveshark.Radio.GENRE_GRIME,
            'tango': grooveshark.Radio.GENRE_TANGO,
            'schlager': grooveshark.Radio.GENRE_SCHLAGER,
            'death metal': grooveshark.Radio.GENRE_DEATHMETAL,
            'chillout': grooveshark.Radio.GENRE_CHILLOUT,
            'melodic': grooveshark.Radio.GENRE_MELODIC,
            'reggaeton': grooveshark.Radio.GENRE_REGGAETON,
            'grunge': grooveshark.Radio.GENRE_GRUNGE,
            'indie pop': grooveshark.Radio.GENRE_INDIEPOP,
            'relax': grooveshark.Radio.GENRE_RELAX,
            'club': grooveshark.Radio.GENRE_CLUB,
            'pop punk': grooveshark.Radio.GENRE_POPPUNK,
            'hard core': grooveshark.Radio.GENRE_HARDCORE,
            'indie rock': grooveshark.Radio.GENRE_INDIEROCK,
            'funk': grooveshark.Radio.GENRE_FUNK,
            'neo soul': grooveshark.Radio.GENRE_NEOSOUL,
            'trip hop': grooveshark.Radio.GENRE_TRIPHOP,
            'j rock': grooveshark.Radio.GENRE_JROCK,
            'merengue': grooveshark.Radio.GENRE_MERENGUE,
            'soul': grooveshark.Radio.GENRE_SOUL,
            'rumba': grooveshark.Radio.GENRE_RUMBA,
            'progressive rock': grooveshark.Radio.GENRE_PROGRESSIVEROCK,
            'eurodance': grooveshark.Radio.GENRE_EURODANCE,
            'folk rock': grooveshark.Radio.GENRE_FOLKROCK,
            'island': grooveshark.Radio.GENRE_ISLAND,
            'sertanejo': grooveshark.Radio.GENRE_SERTANEJO,
            'metal core': grooveshark.Radio.GENRE_METALCORE,
            '50s': grooveshark.Radio.GENRE_50S,
            'vocal': grooveshark.Radio.GENRE_VOCAL,
            'indie': grooveshark.Radio.GENRE_INDIE,
            'bluegrass': grooveshark.Radio.GENRE_BLUEGRASS,
            'jazz fusion': grooveshark.Radio.GENRE_JAZZFUSION,
            'darkwave': grooveshark.Radio.GENRE_DARKWAVE,
            '8bit': grooveshark.Radio.GENRE_8BIT,
            'rap': grooveshark.Radio.GENRE_RAP,
            'ambient': grooveshark.Radio.GENRE_AMBIENT,
            'flamenco': grooveshark.Radio.GENRE_FLAMENCO,
            'brit pop': grooveshark.Radio.GENRE_BRITPOP,
            'trance': grooveshark.Radio.GENRE_TRANCE,
            'numetal': grooveshark.Radio.GENRE_NUMETAL,
            'roots reggae': grooveshark.Radio.GENRE_ROOTSREGGAE,
            'lounge': grooveshark.Radio.GENRE_LOUNGE,
            '80s': grooveshark.Radio.GENRE_80S,
            'electro': grooveshark.Radio.GENRE_ELECTRO,
            'beach': grooveshark.Radio.GENRE_BEACH,
            'surf': grooveshark.Radio.GENRE_SURF,
            'reggae': grooveshark.Radio.GENRE_REGGAE,
            '60s': grooveshark.Radio.GENRE_60S,
            'dcima': grooveshark.Radio.GENRE_DCIMA,
            'rock steady': grooveshark.Radio.GENRE_ROCKSTEADY,
            'hip hop': grooveshark.Radio.GENRE_HIPHOP,
            'electro pop': grooveshark.Radio.GENRE_ELECTROPOP,
            'rockabilly': grooveshark.Radio.GENRE_ROCKABILLY,
            'salsa': grooveshark.Radio.GENRE_SALSA,
            'psychedelic': grooveshark.Radio.GENRE_PSYCHEDELIC,
            'celtic': grooveshark.Radio.GENRE_CELTIC,
            'metal': grooveshark.Radio.GENRE_METAL,
            'cumbia': grooveshark.Radio.GENRE_CUMBIA,
            'jungle': grooveshark.Radio.GENRE_JUNGLE,
            'zydeco': grooveshark.Radio.GENRE_ZYDECO
                            }

def _make_file_name(song):
    """Returns a valid file name for a song object."""
    valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)
    fname = '{} - {}.mp3'.format(song.name.encode('utf8', 'replace'),
                                 song.artist.name.encode('utf8', 'replace'))
    fname = ''.join(c for c in fname if c in valid_chars)

    return fname

def _delete_file(f_path):
    """Deletes a file."""
    if os.path.isfile(f_path):
        os.unlink(f_path)
        return True
    else:
        return False

        
def register_as_service(service_class, robot_ip="127.0.1"):
    """Register service."""
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
    """Registers service"""
    register_as_service(ALMusic)
    app = qi.Application()
    app.run()

if __name__ == "__main__":
    main()
