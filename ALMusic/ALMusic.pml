<?xml version="1.0" encoding="UTF-8" ?>
<Package name="ALMusic" format_version="4">
    <Manifest src="manifest.xml" />
    <BehaviorDescriptions>
        <BehaviorDescription name="behavior" src="Robot DJ" xar="behavior.xar" />
    </BehaviorDescriptions>
    <Dialogs>
        <Dialog name="SongSelector" src="Robot DJ/dialog/SongSelector/SongSelector.dlg" />
    </Dialogs>
    <Resources>
        <File name="icon" src="icon.png" />
        <File name="__init__" src="lib/grooveshark/__init__.py" />
        <File name="__init__" src="lib/grooveshark/classes/__init__.py" />
        <File name="album" src="lib/grooveshark/classes/album.py" />
        <File name="artist" src="lib/grooveshark/classes/artist.py" />
        <File name="picture" src="lib/grooveshark/classes/picture.py" />
        <File name="playlist" src="lib/grooveshark/classes/playlist.py" />
        <File name="radio" src="lib/grooveshark/classes/radio.py" />
        <File name="song" src="lib/grooveshark/classes/song.py" />
        <File name="stream" src="lib/grooveshark/classes/stream.py" />
        <File name="const" src="lib/grooveshark/const.py" />
        <File name="__init__" src="lib/grooveshark/utils/__init__.py" />
        <File name="tags" src="lib/grooveshark/utils/tags.py" />
        <File name="tokens" src="lib/grooveshark/utils/tokens.py" />
        <File name="version" src="lib/grooveshark/version.py" />
        <File name="almusic" src="lib/almusic.py" />
        <File name="" src=".directory" />
    </Resources>
    <Topics>
        <Topic name="SongSelector_enu" src="Robot DJ/dialog/SongSelector/SongSelector_enu.top" topicName="SongSelector" language="en_US" />
    </Topics>
    <IgnoredPaths />
</Package>
