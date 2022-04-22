import { RunOptions, UnusedTranslations, MissedTranslations } from '../types';

import { initialize } from '../core/initialize';
import {
  collectUnusedTranslations,
  collectMissedTranslations,
} from '../core/translations';
import { generateFilesPaths, getFileSizeKb } from '../helpers/files';

export const displayUnusedTranslations = async (
  options: RunOptions,
): Promise<UnusedTranslations> => {
  const config = await initialize(options);

  const localesFilesPaths = await generateFilesPaths(config.localesPath, {
    srcExtensions: config.localesExtensions,
    fileNameResolver: config.localeNameResolver,
  });

  const srcFilesPaths = await generateFilesPaths(
    `${process.cwd()}/${config.srcPath}`,
    {
      srcExtensions: config.srcExtensions,
      ignorePaths: config.ignorePaths,
      basePath: config.srcPath,
    },
  );

  const unusedTranslations = await collectUnusedTranslations(
    localesFilesPaths,
    srcFilesPaths,
    {
      context: config.context,
      contextSeparator: config.translationContextSeparator,
      ignoreComments: config.ignoreComments,
      localeFileParser: config.localeFileParser,
      excludeTranslationKey: config.excludeKey,
    },
  );

  unusedTranslations.translations.forEach((translation) => {
    console.log(
      '<<<==========================================================>>>',
    );
    console.log(`Unused translations in: ${translation.localePath}`);
    console.log(`Unused translations count: ${translation.count}`);
    console.table(
      translation.keys.map((key: string) => ({ Translation: key })),
    );
  });

  console.log(
    `Total unused translations count: ${unusedTranslations.totalCount}`,
  );

  console.log(
    `Can free up memory: ~${getFileSizeKb(
      unusedTranslations.translations.reduce(
        (acc, { keys }) => `${acc}, ${keys.join(', ')}`,
        '',
      ),
    )}kb`,
  );

  return unusedTranslations;
};

export const displayMissedTranslations = async (
  options: RunOptions,
): Promise<MissedTranslations> => {
  const config = await initialize(options);

  const localesFilesPaths = await generateFilesPaths(config.localesPath, {
    srcExtensions: config.localesExtensions,
    fileNameResolver: config.localeNameResolver,
  });

  const srcFilesPaths = await generateFilesPaths(
    `${process.cwd()}/${config.srcPath}`,
    {
      srcExtensions: config.srcExtensions,
      ignorePaths: config.ignorePaths,
      basePath: config.srcPath,
    },
  );

  const missedTranslations = await collectMissedTranslations(
    localesFilesPaths,
    srcFilesPaths,
    {
      context: config.context,
      contextSeparator: config.translationContextSeparator,
      ignoreComments: config.ignoreComments,
      localeFileParser: config.localeFileParser,
      excludeTranslationKey: config.excludeKey,
      translationKeyMatcher: config.translationKeyMatcher,
    },
  );
  missedTranslations.translations.forEach((translation) => {
    console.log(
      '<<<==========================================================>>>',
    );
    console.log(`Missing translations for : ${translation.filePath}`);
    console.log(`for locale: ${translation.localePath}`);

    console.log('Static Keys: ');
    console.table(translation.staticKeys.map((key: string) => ({ Key: key })));

    console.log('Dynamic Keys: ');
    console.table(translation.dynamicKeys.map((key: string) => ({ Key: key })));
  });

  console.log(
    `Total missed static translations count: ${missedTranslations.totalStaticCount}`,
  );
  console.log(
    `Total missed dynamic translations count: ${missedTranslations.totalDynamicCount}`,
  );

  return missedTranslations;
};
