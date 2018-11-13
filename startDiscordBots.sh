#!/usr/bin/env bash

echo Starting Pinnerland Discord Bots...

cd DictionaryBot
echo Initializing Dictionary Bot...
./startDictionaryBot.sh &
cd ..

cd GoocherBot
echo Initializing Goocher Bot...
./startGoocherBot.sh &
cd ..

cd PinnerBot
echo Initializing Pinner Bot...
./startPinnerBot.sh &
cd ..

cd StuckInPlatBot
echo Initializing Stuck in Plat Bot...
./startStuckInPlatBot.sh &
cd ..

cd YerTroshKehdBot
echo Initializing Yer Trosh Kehd Bot...
./startYerTroshKehdBot.sh &
cd ..