import os
import qi
import threading
import butane
from butane.conversation import Conversation


class MusicInterface(object):

    def __init__(self, box):
        self.session = box.session()
        self.box = box
        self.logger = box.logger
        self.pkg_id = self.box.packageUid()
        self.pkg_path = os.path.join(os.path.expanduser('~'),
                                     '.local',
                                     'share',
                                     'PackageManager',
                                     'apps',
                                     self.pkg_id)

        # services
        self.motion = self.session.service('ALMotion')
        self.gesture = self.session.service('ALTactileGesture')
        self.music = self.session.service('Music')
        self.dialog = self.session.service('ALDialog')
        if butane.is_pepper(self.session):
            self.tablet = self.session.service('ALTabletService')
            self.robot_ip = self.tablet.robotIp()

        # signals
        self.gesture_signal_id = self.gesture.onGesture.connect(self.on_gesture)

        # locks
        self.command_lock = threading.Lock()

        # promises and futures
        self.stop_promise = qi.Promise()
        self.stop_future = self.stop_promise.future()

    def stop(self):
        try:
            self.stop_promise.setValue(True)
        except RuntimeError:
            pass

    def on_unload(self):
        self.gesture.onGesture.disconnect(self.gesture_signal_id)

    def on_gesture(self, gesture):
        if gesture == 'DoubleFront' and self.command_lock.acquire(False):
            self.handleCommand()

    def handleCommand(self):
        with Conversation('MusicMenu') as convo:
            response = convo.ask('menu')

        if ';' in response:
            command, query = response.split(';')
        else:
            command = response

        if command == 'play':
            qi.async(self.music.play, query)
        elif command == 'play_queue':
            qi.async(self.music.play)
        elif command == 'enqueue':
            qi.async(self.music.enqueue, query)
        elif command == 'stop':
            qi.async(self.music.stop)
        elif command == 'next':
            qi.async(self.music.next)
        elif command == 'clear':
            qi.async(self.music.clearQueue)

        self.command_lock.release()

    def show_interface(self):
        self.tablet.loadUrl('http://{}/apps/{}/'.format(self.robot_ip,
                                                        self.pkg_id))
        self.tablet.showWebview()

    def main(self):
        """Main aplication."""
        try:
            self.dialog._loadStrategyConfiguration(
                os.path.join(self.pkg_path, "strategy1.ini"))
            if butane.is_pepper(self.session):
                self.show_interface()

            # wait until app is killed / stopped
            self.stop_future.wait()
        except RuntimeError as err:
            self.logger.warning(err)
        finally:
            self.box.onStopped(1)
