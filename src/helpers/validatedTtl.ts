import InvalidTtlError from '../error/InvalidTtlError'

export default (
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  ttlInSeconds: any,
  defaultTtlInS?: number
): number | undefined => {
  // validate only if ttl is given
  if (typeof ttlInSeconds === 'undefined' || ttlInSeconds === null) {
    return defaultTtlInS
  }

  const ttl = parseInt(ttlInSeconds, 10)
  if (Number.isNaN(ttl) || ttl <= 0) {
    throw new InvalidTtlError('ttlInSeconds should be a non-zero integer')
  }
  return ttl
}
