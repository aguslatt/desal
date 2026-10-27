import {Config} from '@remotion/cli/config';
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(12);
Config.setPixelFormat('yuv420p');
