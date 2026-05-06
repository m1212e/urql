import * as React from 'react';
import type { Client } from '@m1212e/urql-core';

/** Function to cache an urql-client across React Server Components.
 *
 * @param makeClient - A function that creates an urql-client.
 * @returns an object containing a getClient method.
 *
 * @example
 * ```ts
 * import { cacheExchange, createClient, fetchExchange, gql } from '@m1212e/urql-core';
 * import { registerUrql } from '@m1212e/urql-next/rsc';
 * const makeClient = () => {
 *   return createClient({
 *     url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
 *     exchanges: [cacheExchange, fetchExchange],
 *   });
 * };
 *
 * const { getClient } = registerUrql(makeClient);
 * ```
 */
export function registerUrql(makeClient: () => Client): {
  getClient: () => Client;
} {
  // @ts-ignore you exist don't worry
  const getClient = React.cache(makeClient);
  return {
    getClient,
  };
}
