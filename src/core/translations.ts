import { readFileSync } from 'fs';

import {
  UnusedTranslation,
  UnusedTranslations,
  MissedTranslation,
  MissedTranslations,
  ModuleResolver,
  TranslationKeyMatcher,
} from '../types';

import { resolveFile } from '../helpers/files';
import { generateTranslationsFlatKeys } from '../helpers/flatKeys';

const replaceQuotes = (v: string): string => v.replace(/['"`]/gi, '');

const isStaticKey = (v: string): boolean => !v.includes('${') && /['"]/.test(v);

const isDynamicKey = (v: string): boolean =>
  v.includes('${') || !/['"]/.test(v);

const isInlineComment = (str: string): boolean => /^(\/\/)/.test(str);
const isHTMLComment = (str: string): boolean => /^(<!--)/.test(str);
const isStartOfMultilineComment = (str: string): boolean => /^(\/\*)/.test(str);
const isEndOfMultilineComment = (str: string): boolean => /^(\*\/)/.test(str);

const removeComments = (fileTxt: string): string => {
  let skip = false;

  return fileTxt
    .split('\n')
    .reduce((acc, str) => {
      const _str = str.trim();

      if (isStartOfMultilineComment(_str) || isEndOfMultilineComment(_str)) {
        skip = isStartOfMultilineComment(_str);
      }

      if (skip || isInlineComment(_str) || isHTMLComment(_str)) {
        return acc;
      }

      acc.push(str);

      return acc;
    }, [])
    .join('\n');
};

interface unusedOptions {
  context: boolean;
  contextSeparator: string,
  ignoreComments: boolean;
  localeFileParser?: ModuleResolver;
  excludeTranslationKey?: string | string[];
}

export const collectUnusedTranslations = async (
  localesPaths: string[],
  srcFilesPaths: string[],
  {
    ignoreComments,
    localeFileParser,
    excludeTranslationKey,
    contextSeparator,
    context,
  }: unusedOptions,
): Promise<UnusedTranslations> => {
  const translations: UnusedTranslation = [];

  for (const localePath of localesPaths) {
    const locale = await resolveFile(localePath, localeFileParser);
    const translationsKeys = generateTranslationsFlatKeys(locale, {
      excludeKey: excludeTranslationKey,
      contextSeparator,
      context,
    });

    srcFilesPaths.forEach((filePath: string) => {
      const file = readFileSync(filePath).toString();

      [...translationsKeys].forEach((key: string) => {
        if ((ignoreComments ? removeComments(file) : file).includes(key)) {
          translationsKeys.splice(translationsKeys.indexOf(key), 1);
        }
      });
    });

    translations.push({
      localePath: localePath,
      keys: translationsKeys,
      count: translationsKeys.length,
    });
  }

  return {
    translations,
    totalCount: translations.reduce((acc, { count }) => acc + count, 0),
  };
};

interface missedOptions {
  context: boolean;
  contextSeparator: string,
  ignoreComments: boolean;
  localeFileParser?: ModuleResolver;
  excludeTranslationKey?: string | string[];
  translationKeyMatcher?: TranslationKeyMatcher;
}

export const collectMissedTranslations = async (
  localesPaths: string[],
  srcFilesPaths: string[],
  {
    context,
    ignoreComments,
    localeFileParser,
    contextSeparator,
    excludeTranslationKey,
    translationKeyMatcher,
  }: missedOptions,
): Promise<MissedTranslations> => {
  const translations: MissedTranslation = [];
  for (const localePath of localesPaths) {
    const locale = await resolveFile(localePath, localeFileParser);

    const flatKeys = [...new Set(generateTranslationsFlatKeys(locale, {
      excludeKey: excludeTranslationKey,
      contextSeparator,
      context,
    }))];

    const filesMissedTranslationsKeys: { [key: string]: string[] } =
      await srcFilesPaths.reduce(async (asyncAcc, filePath) => {
        const acc: { [key: string]: string[] } = await asyncAcc;
        acc[filePath] = acc[filePath] || [];

        const file = readFileSync(filePath).toString();

        const matchKeys = (
          (ignoreComments ? removeComments(file) : file).match(
            translationKeyMatcher,
          ) || []
        )
          .map((v) => {
            const [match] = v.match(/\((.*?)\)/gi);
            const [translation] = match.split(',');

            return translation.replace(/(\(|\)|\[\d\])/gi, '');
          })
          .filter((v) => !flatKeys.includes(replaceQuotes(v)));

        if (matchKeys.length) {
          acc[filePath].push(...matchKeys);
        }

        return acc;
      }, Promise.resolve({}));

    Object.keys(filesMissedTranslationsKeys).forEach((filePath: string) => {
      if (!filesMissedTranslationsKeys[filePath].length) {
        return;
      }

      const staticKeys = filesMissedTranslationsKeys[filePath]
        .filter(isStaticKey)
        .map(replaceQuotes);
      const dynamicKeys = filesMissedTranslationsKeys[filePath]
        .filter(isDynamicKey)
        .map(replaceQuotes);

      translations.push({
        localePath,
        filePath,
        staticKeys,
        dynamicKeys,
        staticCount: staticKeys.length,
        dynamicCount: dynamicKeys.length,
      });
    });


  }
  return {
    translations,
    totalStaticCount: translations.reduce(
      (acc, { staticCount: c }) => acc + c,
      0,
    ),
    totalDynamicCount: translations.reduce(
      (acc, { dynamicCount: c }) => acc + c,
      0,
    ),
  };
};
