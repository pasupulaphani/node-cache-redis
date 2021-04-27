# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),


## [6.4.1](https://github.com/pasupulaphani/node-cache-redis/releases/tag/v6.4.1) - 2021-04-27

### Fixed

- The following vulnerabilities are fixed with an upgrade: https://snyk.io/vuln/SNYK-JS-REDIS-1255645

## [6.3.1](https://github.com/pasupulaphani/node-cache-redis/releases/tag/v6.3.1) - 2021-03-14

### Fixed

- Fix typo in defaulTtlInS 

## [6.2.0](https://github.com/pasupulaphani/node-cache-redis/releases/tag/v6.2.0) - 2021-02-06

### Added

- Added type definition files

## [6.0.0](https://github.com/pasupulaphani/node-cache-redis/releases/tag/v6.0.0) - 2020-05-25

### Added

- Typescipt
- Ability to unset defaultTtl

### Fixed

- Do not fallback to defaultTtl when ttl override is invalid

## [5.1.0](https://github.com/pasupulaphani/node-cache-redis/releases/tag/v5.1.0) - 2020-05-23

### Changed

- Using ES6 classes
- Renamed prop ttlInSeconds to defaultTtlInS in redisCache.init.

## [5.0.0](https://github.com/pasupulaphani/node-cache-redis/releases/tag/v5.0.0) - 2020-05-23

### Changed

- LICENCE UPDATE - MIT license

## [4.0.0](https://github.com/pasupulaphani/node-cache-redis/releases/tag/v4.0.0) - 2020-05-17

### Changed

- BREAKING CHANGE - Remove RedisCache class. Move RedisCache to module.

## [3.1.0](https://github.com/pasupulaphani/node-cache-redis/releases/tag/v3.1.0) - 2020-05-17

### Changed

- Major cleanup and dependency updates
