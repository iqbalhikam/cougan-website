export type Streamer = {
  id: string;
  name: string;
  role: string;
  channelId: string; // The YouTube Channel ID (persistent)
  youtubeId: string; // The video ID for the live stream or latest video
  avatar: string;
  status: 'live' | 'offline';
};

export const streamers: Streamer[] = [
  {
    id: '1',
    name: 'Crystal Oda Cougan',
    role: 'Godmother',
    channelId: 'UCVox_6S1p0JBJx3MIMxUHIQ', // TODO: Find Channel ID
    youtubeId: '',
    avatar: '/Crystal-Oda-Cougan.jpg',
    status: 'offline',
  },
  {
    id: '2',
    name: 'Gashima Cougan',
    role: 'Tuan Muda',
    channelId: 'UCTpZgMOcivUsd9C2FCiwQ2A',
    youtubeId: '',
    avatar: '/gashima-cougan.jpg',
    status: 'offline',
  },
  {
    id: '3',
    name: 'Abimanyu Cougan',
    role: 'BIG BOSS',
    channelId: 'UCzDqjuYInUPp3UyuQMS7B-Q', // TODO: Find Channel ID
    youtubeId: '',
    avatar: '/abimanyu-cougan.jpg',
    status: 'offline',
  },
  {
    id: '4',
    name: 'Di4vell',
    role: 'Member',
    channelId: 'UCXMx8DZWH91C43QeRP6dR3g',
    youtubeId: '',
    avatar: '/D4vel--Cougan.jpg',
    status: 'offline',
  },
  {
    id: '5',
    name: 'Bangking25',
    role: 'Godfather',
    channelId: 'UC21jlheq1Md8BQaWrii7V6w',
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=Bangking25&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '6',
    name: 'SEptazoe',
    role: 'Soldier',
    channelId: 'UCY06vxuyFJrv3jQ9sDGv3ng',
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=SEptazoe&background=000&color=d4af37',
    status: 'offline',
  },

  {
    id: '7',
    name: 'ImWahyuSkyy',
    role: 'Member',
    channelId: 'UCKfVAASgzT4ynMBa5cOhFUA', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=ImWahyuSkyy&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '8',
    name: 'WiskaGudut',
    role: 'Member',
    channelId: 'UCf0OL86JVEqf0ejkULLnVFA', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=WiskaGudut&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '9',
    name: 'ZukaaaAmat',
    role: 'Member',
    channelId: 'UC7StJFG0KbDpj4vUZhbBcdA', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=ZukaaaAmat&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '10',
    name: 'haraazy',
    role: 'Member',
    channelId: 'UCTw-hQ197ZSU7wwvB6iav_Q', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=haraazy&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '11',
    name: 'sarahmaheswara',
    role: 'Member',
    channelId: 'UCRpjWT4pLKSRMIHe1tDt7HA', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=sarahmaheswara&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '12',
    name: 'petrix35',
    role: 'Member',
    channelId: 'UC5SORctGpjsLRxX6DJj9NNA', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=petrix35&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '13',
    name: 'BbyAngelllll',
    role: 'Member',
    channelId: 'UCGGtYwqIYO_nx0gAe16DJmw', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=BbyAngelllll&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '14',
    name: 'smarttupai8316',
    role: 'Member',
    channelId: 'UCDc5YC15xZAU1I4S4pFy9VA', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=smarttupai8316&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '15',
    name: 'ReynoYabriRenel',
    role: 'Member',
    channelId: 'UC9Wss8O8dDwqaO7gGGkdJ_Q', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=ReynoYabriRenel&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '16',
    name: 'ibeeyorii',
    role: 'Member',
    channelId: 'UCZW7syuDzTBMiDQ3ZZKS6Ig', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=ibeeyorii&background=000&color=d4af37',
    status: 'offline',
  },
  {
    id: '17',
    name: 'ABAH-F',
    role: 'Member',
    channelId: 'UCI8im5Xz1vy-CuZ-ecLN3JA', // TODO: Find Channel ID
    youtubeId: '',
    avatar: 'https://ui-avatars.com/api/?name=ABAH-F&background=000&color=d4af37',
    status: 'offline',
  },
];
