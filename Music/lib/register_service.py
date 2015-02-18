import music
import qi


def register_as_service(service_class, robot_ip="127.0.1"):
    """Registers naoqi service."""
    session = qi.Session()
    session.connect('tcp://{}:9559'.format(robot_ip))
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
                    print 'Unregistered {} as {}'.format(service_name,
                                                         info['serviceId'])
                    break
            except (KeyError, IndexError):
                pass
        session.registerService(service_name, instance)
        print 'Successfully registered service: {}'.format(service_name)
    return instance


def main():
    """Register the service."""
    register_as_service(music.Music)
    app = qi.Application()
    app.run()

if __name__ == '__main__':
    main()
