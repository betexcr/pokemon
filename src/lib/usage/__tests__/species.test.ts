import { describe, it, expect } from 'vitest';
import { dexIdForSpecies, resolveSpecies, usageSpriteUrls, toSpeciesId } from '../species';
import { inferPokemonId, parseSmogonUsageHeader } from '../parseSmogonUsage';

describe('species resolution for Smogon names', () => {
  it.each([
    ['Great Tusk', 984],
    ['Kingambit', 983],
    ['Gholdengo', 1000],
    ['Dragapult', 887],
    ['Iron Valiant', 1006],
    ['Ting-Lu', 1003],
    ['Ho-Oh', 250],
    ['Kommo-o', 784],
    ['Porygon-Z', 474],
    ['Porygon2', 233],
    ['Mr. Mime', 122],
    ['Type: Null', 772],
    ['Farfetch’d', 83],
    ["Farfetch'd", 83],
    ['Flabébé', 669],
    ['Nidoran-F', 29],
    ['Pecharunt', 1025],
  ])('%s → #%i', (name, id) => {
    expect(dexIdForSpecies(name)).toBe(id);
    expect(inferPokemonId(name)).toBe(id);
  });

  it.each([
    ['Landorus-Therian', 645, 'Therian', 'landorus-therian'],
    ['Samurott-Hisui', 503, 'Hisui', 'samurott-hisui'],
    ['Urshifu-Rapid-Strike', 892, 'Rapid-Strike', 'urshifu-rapidstrike'],
    ['Ogerpon-Wellspring', 1017, 'Wellspring', 'ogerpon-wellspring'],
    ['Tauros-Paldea-Aqua', 128, 'Paldea-Aqua', 'tauros-paldeaaqua'],
    ['Ninetales-Alola', 38, 'Alola', 'ninetales-alola'],
    ['Kommo-o-Totem', 784, 'Totem', 'kommoo-totem'],
  ])('%s → base #%i, forme %s, sprite %s', (name, id, forme, spriteId) => {
    expect(resolveSpecies(name)).toMatchObject({ dexId: id, forme, spriteId });
  });

  it('never invents an id for unknown names', () => {
    expect(dexIdForSpecies('Missingno')).toBe(0);
    expect(resolveSpecies('Missingno').dexId).toBeNull();
  });

  it('uses dex artwork for base forms and Showdown forme sprites for alternate formes', () => {
    expect(usageSpriteUrls('Kingambit')[0]).toContain('/official-artwork/983.png');
    const lando = usageSpriteUrls('Landorus-Therian');
    expect(lando[0]).toBe('https://play.pokemonshowdown.com/sprites/dex/landorus-therian.png');
    expect(lando).toContain('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/645.png');
    expect(lando[lando.length - 1]).toBe('/placeholder-pokemon.png');
  });

  it('builds Showdown ids', () => {
    expect(toSpeciesId('Nidoran♀')).toBe('nidoranf');
    expect(toSpeciesId('Type: Null')).toBe('typenull');
  });
});

describe('parseSmogonUsageHeader', () => {
  it('reads total battles and average weight', () => {
    expect(parseSmogonUsageHeader(' Total battles: 1234567\n Avg. weight/team: 0.012\n')).toEqual({
      totalBattles: 1234567,
      avgWeightPerTeam: 0.012,
    });
  });
});
