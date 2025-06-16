/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Joi} from '@docusaurus/utils-validation';
import type {
  ThemeConfig,
  ThemeConfigValidationContext,
} from '@docusaurus/types';

export const Schema = Joi.object<ThemeConfig>({
  upstash: Joi.object({
    enableAiChat: Joi.boolean(),
    aiChatApiEndpoint: Joi.string(),
    upstashSearchRestUrl: Joi.string().required(),
    upstashSearchReadOnlyRestToken: Joi.string().required(),
    upstashSearchIndexNamespace: Joi.string().required(),
  })
    .label('themeConfig.upstash')
    .required()
    .unknown(),
});

export function validateThemeConfig({
  validate,
  themeConfig,
}: ThemeConfigValidationContext<ThemeConfig>): ThemeConfig {
  return validate(Schema, themeConfig);
}
