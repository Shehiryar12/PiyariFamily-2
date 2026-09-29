const EMAIL_PATTERN = /@/;

export const isEmailLikeName = (value?: string | null) => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 && EMAIL_PATTERN.test(trimmed);
};

export const pickPersonName = (
  ...candidates: Array<string | null | undefined>
) => {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed || isEmailLikeName(trimmed)) {
      continue;
    }

    return trimmed;
  }

  return '';
};

export const pickDisplayFirstName = (
  ...candidates: Array<string | null | undefined>
) => {
  const fullName = pickPersonName(...candidates);
  return fullName ? fullName.split(/\s+/)[0] : '';
};

export const buildWelcomeGreeting = (
  ...nameCandidates: Array<string | null | undefined>
) => {
  const firstName = pickDisplayFirstName(...nameCandidates);
  return firstName ? `Welcome, ${firstName}` : 'Welcome';
};

export const greetingHasEmail = (greeting?: string | null) =>
  isEmailLikeName(greeting);
