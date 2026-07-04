import { Avatar, Style } from '@dicebear/core';
import dylanStyle from '@dicebear/styles/dylan.json' with { type: 'json' };

const dylan = new Style(dylanStyle);

export function getProfileAvatarDataUri(profileIndex: number): string {
  return new Avatar(dylan, { seed: `profile-${profileIndex}` }).toDataUri();
}
