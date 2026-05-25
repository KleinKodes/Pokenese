# Pokenese

## Description

Pokenese is intended to be a fun tool to help users learn chinese via Pokemon names.

It is intended to be a sort of daily game like wordle, pokedle, fooguessr and connections but with a more educational twist.

## Features

This website will have 3 modes:

1) Glossary/Pokedex

   - Lets users review information (mandarin name, pinyin, pronounciation, chinese etymology) about pokemon they have encountered in either of the other two modes

2) Daily

   - Users around the globe see the same 3 challenges sequentially and are scored based on number of guesses needed to solve each. Users can share each days score as well as a graphic detailing their score history (all time).

3) Challenge

   - Users are given an 'endless' random sequence of pokemon challenges until they cover the entire pokedex. Score is still tracked like in the daily mode. If a user fails then both their score and pokemon pool are reset.

## Challenges

Challenges are structured as follows:

1) Players are displayed a pokemon's chinese name in both mandarin and pinyin (can be disabled optionally for extreme mode). Players can also press a button to play the pronounciation of the chinese name (there should also be a toggle-able setting to enable the additional display of the IPA phonetic pronounciations of the chinese characters)

2) Players need to guess the english name of the pokemon that the chinese refers to.

3) If a player fails they receive the following hints, in order:

   1) Root meanings of each character in the name (e.g. Charizard is pen-huo-long (ignoring tonal accents) so the site would display 'pen=spit, huo=fire, long=dragon' in some way)
   2) Generation said pokemon debuted in
   3) Typing
   4) English pokedex alternate name (e.g. arcanine is 'the legendary pokemon')

4) If a player fails on their 5th guess the pokemon is revealed and they received a score based on proximity of their best guess (same evolution line > same full typing > partially same typing > shared chinese character)

5) If a player succeeds their score is solely and linearly based on how many hints they needed (Caps out at 3000).

## Priorities

- Website must be mobile friendly
- Account creation should be optional, can store necessary info in browser cache until account is created
- Website must have strong and clean visual identity, noone will want to use it if it dooes not look modern, sleek and visually appealing
- Necessary pokemon data should be scraped from online and stored as constants in typescript files so that they do not take up an uncessary amount of backend space but I can still make changes to them (e.g. I might want to change a word in the etymology depiction for some pokemon).
- Backend should be Python fastAPI and frontend should be next typescript.
