/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {validateThemeConfig} from '../validateThemeConfig';
import type {Joi} from '@docusaurus/utils-validation';

function testValidateThemeConfig(themeConfig: {[key: string]: unknown}) {
  function validate(
    schema: Joi.ObjectSchema<{[key: string]: unknown}>,
    cfg: {[key: string]: unknown},
  ) {
    const {value, error} = schema.validate(cfg, {
      convert: false,
    });
    if (error) {
      throw error;
    }
    return value;
  }

  return validateThemeConfig({themeConfig, validate});
}

describe('validateThemeConfig', () => {
  const validConfig = {
    upstash: {
      enableAiChat: true,
      aiChatApiEndpoint: 'https://example-function.upstash.io',
      upstashSearchRestUrl: 'https://example-rest.upstash.io/v1',
      upstashSearchReadOnlyRestToken: 'token',
      upstashSearchIndexNamespace: 'docs',
    },
  };

  it('minimal valid config', () => {
    expect(testValidateThemeConfig(validConfig)).toEqual(validConfig);
  });

  it('accepts unknown attributes', () => {
    const configWithExtra = {
      upstash: {
        ...validConfig.upstash,
        unknownKey: 'unknownValue',
      },
    };
    expect(testValidateThemeConfig(configWithExtra)).toEqual(configWithExtra);
  });

  it('undefined config', () => {
    expect(() =>
      testValidateThemeConfig({}),
    ).toThrowErrorMatchingInlineSnapshot(`""themeConfig.upstash" is required"`);
  });

  it('missing enableAiChat', () => {
    const {enableAiChat, ...rest} = validConfig.upstash;
    expect(() =>
      testValidateThemeConfig({upstash: rest}),
    ).toThrowErrorMatchingInlineSnapshot(`""upstash.enableAiChat" is required"`);
  });

  it('missing aiChatApiEndpoint', () => {
    const {aiChatApiEndpoint, ...rest} = validConfig.upstash;
    expect(() =>
      testValidateThemeConfig({upstash: rest}),
    ).toThrowErrorMatchingInlineSnapshot(`""upstash.aiChatApiEndpoint" is required"`);
  });

  it('missing upstashSearchRestUrl', () => {
    const {upstashSearchRestUrl, ...rest} = validConfig.upstash;
    expect(() =>
      testValidateThemeConfig({upstash: rest}),
    ).toThrowErrorMatchingInlineSnapshot(`""upstash.upstashSearchRestUrl" is required"`);
  });

  it('missing upstashSearchReadOnlyRestToken', () => {
    const {upstashSearchReadOnlyRestToken, ...rest} = validConfig.upstash;
    expect(() =>
      testValidateThemeConfig({upstash: rest}),
    ).toThrowErrorMatchingInlineSnapshot(`""upstash.upstashSearchReadOnlyRestToken" is required"`);
  });

  it('missing upstashSearchIndexNamespace', () => {
    const {upstashSearchIndexNamespace, ...rest} = validConfig.upstash;
    expect(() =>
      testValidateThemeConfig({upstash: rest}),
    ).toThrowErrorMatchingInlineSnapshot(`""upstash.upstashSearchIndexNamespace" is required"`);
  });

  it('invalid enableAiChat type', () => {
    expect(() =>
      testValidateThemeConfig({
        upstash: {
          ...validConfig.upstash,
          enableAiChat: 'true', // should be boolean
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(`""upstash.enableAiChat" must be a boolean"`);
  });
});
