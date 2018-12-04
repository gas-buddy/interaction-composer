interaction-composer
====================

A command line tool to build interaction models
(for Alexa for now) based on an intermediate
format that is easier to maintain in source
control and across deployment environments.

Usage
=====
```
npx @gasbuddy/interaction-composer <path to json file>
```

See the [test/model](./test/model) directory for a simple example that illustrates environment aware naming
and intent inclusion.

Shorthands
==========

One of the major goals of this module is to reduce the verbosity of intent expression. This includes centralizing relevant data in a single config (as opposed to spreading it around the intents, dialog and slot specifications), it includes support for YAML instead of JSON, and it includes expansion
capabilities.

Expansion
---------

Samples and slot samples support combinations. There are two main features, the bracket-pipe usage:

```
this is a test
this was a test
this will be a test
```

Can be expressed as
```
this [is|was|will be] a test
```

These combinations can include slots, and can also be empty. For example:

```
is [it|this {station}] open [|now|right now]
```

Will expand to:
```
is it open
is it open now
is it open right now
is this {station} open
is this {station} open now
is this {station} open right now
```

Additionally, you can use nested arrays (they're weird in YAML) to have common root patterns:

```
- more [|{details}]
- -
  - about this [|{station}]
```

Which expands to:
```
more
more {details}
more about this
more about this {station}
more {details} about this
more {details} about this station
```
