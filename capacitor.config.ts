import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rektofun.app',
  appName: 'rektofun',
  webDir: 'public',
  // server: {
  //   url: 'www.rekto.fun',
  //   cleartext: false,
  // },
  server: {
  url: 'http://192.168.1.2:3000/',
  cleartext: true,
}
};

export default config;