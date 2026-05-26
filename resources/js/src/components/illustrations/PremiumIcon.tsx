import React from 'react';

// Imports (Fixed typo: calendardSvg -> calendarSvg)
import calendarSvg from '@/assets/illustrations/calendar.png';
import bellSvg from '@/assets/illustrations/bell.svg';
import copySvg from '@/assets/illustrations/copy.png';
import folderDynamicSvg from '@/assets/illustrations/folder_dynamic.png';
import newFolderSvg from '@/assets/illustrations/new_folder.png';
import favFolderSvg from '@/assets/illustrations/fav_folder.png';
import pictureSvg from '@/assets/illustrations/picture.png';
import walletSvg from '@/assets/illustrations/wallet.svg';
import chatSvg from '@/assets/illustrations/chat.png';
import mapPinSvg from '@/assets/illustrations/map_pin.png';
import phoneSvg from '@/assets/illustrations/phone.svg';
import settingSvg from '@/assets/illustrations/setting.png';
import sheildSvg from '@/assets/illustrations/sheild.png';
import megaPhoneSvg from '@/assets/illustrations/megaphone.png';
import dollarSvg from '@/assets/illustrations/dollar.png';
import typeSvg from '@/assets/illustrations/type.png';
import moneySvg from '@/assets/illustrations/money.png';
import feedback from '@/assets/illustrations/feedback.png';
import cakeSvg from '@/assets/illustrations/cake.png';
import congrateSvg from '@/assets/illustrations/congrate.png';
import kadoSvg from '@/assets/illustrations/kado.png';
import sparkSvg from '@/assets/illustrations/spark.png';

// 1. Create a dictionary mapping of all your illustrations
const illustrationMap = {
  feedback: feedback,
  money: moneySvg,
  type: typeSvg,
  calendar: calendarSvg,
  dollar: dollarSvg,
  bell: bellSvg,
  copy: copySvg,
  favFolder: favFolderSvg,
  folderDynamic: folderDynamicSvg,
  newFolder: newFolderSvg,
  picture: pictureSvg,
  wallet: walletSvg,
  chat: chatSvg,
  mapPin: mapPinSvg,
  phone: phoneSvg,
  setting: settingSvg,
  sheild: sheildSvg,
  megaPhone: megaPhoneSvg,
  cake: cakeSvg,
  congrate: congrateSvg,
  kado: kadoSvg,
  spark: sparkSvg,
} as const;

// 2. Extract types from the dictionary keys for strict autocomplete
export type IllustrationName = keyof typeof illustrationMap;

type IllustrationProps = {
  name: IllustrationName; // Replaces 'src'
  alt?: string;           // Made optional (falls back to a default)
  size?: number;
  className?: string;
  paddingY?: string;
};

// 3. Main unified component
export const Illustration: React.FC<IllustrationProps> = ({
  name,
  alt,
  size = 120,
  className = '',
  paddingY = 'py-4',
}) => {
  const src = illustrationMap[name];

  return (
    <div className={`flex flex-col items-center justify-center ${paddingY}`}>
      <img
        src={src}
        alt={alt || `${name} illustration`}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        loading="lazy"
      />
    </div>
  );
};