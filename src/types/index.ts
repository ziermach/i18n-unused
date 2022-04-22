export type RecursiveStruct = {
  [key: string]: string | string[] | RecursiveStruct;
};

export type ApplyFlat = (source: RecursiveStruct, key: string) => void;

export type UnusedTranslation = {
  localePath: string;
  keys: string[];
  count: number;
}[];

export type MissedTranslation = {
  filePath: string;
  staticKeys: string[];
  dynamicKeys: string[];
  staticCount: number;
  dynamicCount: number;
  localePath: string;
}[];

export type UnusedTranslations = {
  translations: UnusedTranslation;
  totalCount: number;
};

export type MissedTranslations = {
  translations: MissedTranslation;
  totalStaticCount: number;
  totalDynamicCount: number;
};

export type ModuleNameResolver = RegExp | ((n: string) => boolean);

export type TranslationKeyMatcher = RegExp;

export type ModuleResolver = (m: RecursiveStruct) => RecursiveStruct;

export type RunOptions = {
  localesExtensions?: string[];
  localesPath?: string;
  srcExtensions?: string[];
  srcPath?: string;
  ignorePaths?: string[];
  excludeKey?: string | string[];
  marker?: string;
  gitCheck?: boolean;
  ignoreComments?: boolean;
  translationKeyMatcher?: TranslationKeyMatcher;
  localeNameResolver?: ModuleNameResolver;
  localeFileParser?: ModuleResolver;
  context?: boolean;
  flatTranslations?: boolean;
  translationSeparator?: string;
  translationContextSeparator?: string;
};
