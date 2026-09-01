# Tarinamaailman juoni- ja tehtävägeneraattori

## Perusidea

HTML- ja JavaScript-sovellus, joka ei ainoastaan arvo irrallisia juonia, vaan simuloi pientä tarinamaailmaa. Järjestelmä muistaa hahmot, lokaatiot, ryhmät, suhteet, tapahtumat ja hahmojen tavoitteet. Näiden pohjalta se tunnistaa kiinnostavia tilanteita ja tarjoaa niistä syntyviä tehtäviä.

Peruskierto:

```text
maailma
  → suhteet
  → tapahtumat
  → seuraukset ja muistot
  → jännitteet ja ongelmat
  → tehtävät
  → uudet suhteet ja tapahtumat
```

Alussa tehtävät voivat olla osittain satunnaisia. Kun historiaa kertyy, tehtävät perustuvat yhä enemmän maailman todelliseen tilaan ja aiempiin tapahtumiin.

## Maailman peruselementit

Generaattori voi sisältää esimerkiksi:

- hahmoja: Maija, kauppias; Rurik, palkkasoturi; Elina, kylänvanhin
- lokaatioita: Majatalo, Vanha kaivos, Jokisatama
- ryhmiä: Kauppiaiden kilta, Vartijat, Salakuljettajat
- hahmojen ominaisuuksia ja tavoitteita
- suhteita hahmojen, ryhmien ja lokaatioiden välillä
- tapahtumahistorian ja hahmojen muistot
- tietoa, salaisuuksia, velkoja ja tarpeita

## Suhdeverkko

Suhteiden ei kannata olla pelkkiä `friend`- tai `enemy`-arvoja. Yksinkertaisessa ensimmäisessä versiossa suhde voi olla asteikolla `-100...+100`:

```js
const character = {
  id: "rurik",
  name: "Rurik",
  locationId: "inn",
  traits: ["greedy", "brave"],
  relations: {
    maija: -45,
    elina: 30
  },
  memories: [
    {
      type: "betrayal",
      targetId: "maija",
      strength: 70,
      reason: "Maija jätti palkkion maksamatta."
    }
  ]
};
```

Oleellista on, että järjestelmä muistaa myös suhteen syyn:

> Rurik suhtautuu Maijaan vihamielisesti (-45), koska Maija jätti palkkion maksamatta.

Yksi tällainen muisto voi myöhemmin synnyttää useita erilaisia tehtäviä.

### Moniulotteiset suhteet

Myöhemmässä versiossa yhden suhdeluvun voi jakaa useaksi arvoksi:

```js
const relation = {
  affection: -20,
  trust: 10,
  fear: 65,
  respect: 40,
  debt: 80
};
```

Tällöin hahmo voi vihata toista, mutta samalla kunnioittaa tätä, pelätä tätä ja olla tälle palveluksen velkaa. Juuri ristiriitaiset suhteet synnyttävät kiinnostavia juonenkoukkuja.

Esimerkiksi ehdot:

```text
affection < -30
debt > 50
```

voisivat tuottaa tilanteen:

> **Vastahakoinen palvelus**  
> Rurik on Maijalle velkaa henkensä, vaikka vihaa tätä. Maija vaatii nyt velan maksettavaksi.

## Verkoston eri yhteydet

Suhdeverkkoon kannattaa sisällyttää muutakin kuin hahmojen väliset suhteet:

- hahmo ↔ hahmo
- hahmo ↔ ryhmä
- hahmo ↔ lokaatio
- ryhmä ↔ ryhmä
- ryhmä ↔ lokaatio

Jos Rurik ystävystyy Salakuljettajien kanssa, Maija tukee Vartijoita ja nämä ryhmät ovat vihollisia, Rurikin ja Maijan välinen suhde voi huonontua automaattisesti:

```js
if (
  relationScore("rurik", "smugglers") > 50 &&
  relationScore("maija", "guards") > 50 &&
  relationScore("smugglers", "guards") < -50
) {
  changeRelation("rurik", "maija", -10);
}
```

Näin maailma alkaa tuottaa emergenttejä eli järjestelmän osien vuorovaikutuksesta syntyviä konflikteja.

## Tehtävägeneraattorin ensimmäinen versio

Aluksi tehtävät voivat perustua yksinkertaisiin templateihin:

```js
const questTemplate = {
  type: "steal",
  requirements: {
    relationBelow: -30
  },
  text: "{giver} haluaa sinun varastavan esineen henkilöltä {target}."
};
```

Jos Rurikin suhde Maijaan on `-45`, järjestelmä voi tarjota:

> **Rurik pyytää sinua varastamaan Maijan kauppakirjan.**

Jos suhde onkin `+70`, sama hahmopari voi tuottaa aivan toisen tehtävän:

> **Rurik pyytää sinua pelastamaan Maijan rosvoilta.**

## Tehtävä on maailman ongelma

Järjestelmän tärkein suunnitteluperiaate on, ettei tehtävää välttämättä generoida suoraan. Ensin generoidaan tai havaitaan **tilanne**.

Esimerkiksi maailman faktat:

```text
Maija tarvitsee lääkettä.
Lääke sijaitsee Vanhassa kaivoksessa.
Maija pelkää kaivoksen haltijaa.
Rurik tuntee kaivoksen.
Rurik vihaa Maijaa.
```

Story engine tunnistaa ongelman:

```text
Maija tarvitsee lääkettä, mutta ei pysty hakemaan sitä itse.
```

Quest-renderer voi tehdä tilanteesta useita ratkaisutapoja:

- hae lääke Vanhasta kaivoksesta
- suostuttele Rurik hakemaan lääke
- varasta lääke kaivoksen haltijalta
- etsi korvaava lääke kauppiaalta

Tällöin järjestelmä ei ole vain quest generator, vaan **story situation generator**.

## Hahmojen tavoitteet

Hahmoille voidaan antaa tavoitteita ja niiden tärkeysjärjestys:

```js
const goals = [
  {
    type: "gainWealth",
    priority: 70
  },
  {
    type: "protect",
    targetId: "elina",
    priority: 90
  }
];
```

Maailman päivityksessä hahmot yrittävät edistää tavoitteitaan:

```text
Rurik haluaa rikastua
  → tarvitsee rahaa
  → tuntee Salakuljettajat
  → alkaa tehdä heille töitä
  → Vartijat alkavat epäillä Rurikia
  → Elina on Vartijoiden ystävä
  → Rurikin ja Elinan suhde joutuu koetukselle
```

Tästä voi syntyä pelaajalle tehtävä:

> **Elina epäilee Rurikin sekaantuneen salakuljetukseen. Selvitä totuus.**

Tehtävää ei tarvitse olla kirjoitettuna kokonaisena etukäteen. Se syntyy hahmon tavoitteista, suhteista ja maailman tapahtumista.

## Tapahtumat, muistot ja tieto

Maailmalla kannattaa olla tapahtumaloki:

```js
const events = [
  {
    id: 143,
    type: "robbery",
    actorId: "rurik",
    targetId: "maija",
    locationId: "harbor",
    witnessIds: ["elina"],
    day: 42
  }
];
```

Tapahtumasta voi seurata automaattisesti:

```text
Maija → Rurik: trust -40
Elina → Rurik: trust -15
Rurik → Maija: fear +10
Jokisatama: crimeLevel +5
```

Samalla tapahtuma luo tietoa:

```text
Elina tietää Rurikin ryöstöstä.
Rurik tietää, että Elina näki ryöstön.
```

Tiedosta voi tulla uusi pelillinen resurssi. Rurik voi yrittää estää Elinaa puhumasta Vartijoille. Jos pelaaja kertoo rikoksesta Vartijoille, seuraukset voivat olla:

```text
Rurik → pelaaja: -60
Maija → pelaaja: +20
Vartijat → pelaaja: +15
Salakuljettajat → pelaaja: -10
```

Yhden tehtävän ratkaisu muuttaa näin myöhempien tehtävien todennäköisyyksiä.

## Jännitejärjestelmä

Generaattori voi etsiä suhteista ja tilanteista kohtia, joissa on paljon narratiivista potentiaalia.

Esimerkiksi:

```js
const tension =
    hostility * 2
  + conflictingGoals
  + secrets
  + debts
  + scarcity
  + proximity;
```

Jos Maijan ja Rurikin välisessä suhteessa on paljon vihamielisyyttä, salaisuus, velka ja molemmat ovat samassa paikassa, järjestelmä päättelee, että suhteessa tapahtuu pian jotakin.

Sopivia tapahtumatyyppejä voisivat olla:

- yhteenotto
- kiristys
- varkaus
- avunpyyntö
- petos
- sovintoyritys
- julkinen paljastus

Tämä toimii pienenä **narratiivisena fysiikkamoottorina**: tapahtumat eivät ole täysin satunnaisia, vaan ne kohdistuvat maailman jännitteisimpiin kohtiin.

## Kolmikerroksinen rakenne

Järjestelmä kannattaa jakaa kolmeen kerrokseen:

```text
WORLD SIMULATION
  ↓
STORY ENGINE
  ↓
TEXT GENERATOR
```

### 1. World simulation

Tietää maailman faktat:

```text
Rurik vihaa Maijaa.
Maija on Rurikille velkaa.
Maijalla on salainen kartta.
```

### 2. Story engine

Päättelee, mitä faktoista voi seurata:

```text
Rurik yrittää saada kartan velan vastineeksi.
```

### 3. Text generator

Esittää tilanteen pelaajalle:

> Rurik nojautuu pöytään ja laskee kätensä Maijan eteen.  
> ”Velka erääntyi. Haluan kartan.”

Tämä jako pitää pelilogiikan ja tekstin erillään. Tekstikerroksen voi myöhemmin vaihtaa esimerkiksi LLM-pohjaiseksi ilman, että maailman simulaatiota tarvitsee muuttaa.

## Ehdotus maailman tietorakenteeksi

```js
const worldState = {
  day: 1,
  characters: [],
  locations: [],
  factions: [],
  relations: [],
  memories: [],
  knowledge: [],
  events: [],
  activeSituations: [],
  completedQuests: []
};
```

Kaiken kannattaa olla serialisoitavaa JSON-dataa. Ensimmäisessä versiossa tallennukseen riittää `localStorage`; myöhemmin voi siirtyä IndexedDB:hen.

## Ensimmäinen MVP

Ensimmäiseen toteutukseen riittää:

- 10 hahmoa
- 5 lokaatiota
- 3 ryhmää
- yksi suhdearvo asteikolla `-100...+100`
- 3 ominaisuutta per hahmo
- 1 tavoite per hahmo
- tapahtumahistoria
- 10 tapahtumatemplatea
- 10 tehtävätemplatea
- JSON-muotoinen `worldState`
- tallennus `localStorageen`

### Käyttöliittymän näkymät

#### World

```text
Päivä 27 — Jokisatama — levottomuuksia
```

#### Characters

```text
Maija
Rurik: vihamielinen (-43)
Elina: ystävä (+62)
```

#### Story feed

```text
Päivä 25: Rurik riiteli Maijan kanssa.
Päivä 26: Rurik liittyi Salakuljettajiin.
Päivä 27: Maija ilmoitti salakuljetuksesta Vartijoille.
```

#### Generate situation

Nappi tuottaa maailman tilasta uuden tilanteen:

> ### Kadonnut lähetys
>
> Maijan kauppatavaraa on kadonnut Jokisatamassa. Hän epäilee Salakuljettajia. Rurik saattaa tietää asiasta enemmän kuin myöntää.

Kehitysvaiheessa tilanteen alla kannattaa näyttää myös perustelut:

```text
Generated because:

Maija → Salakuljettajat: -72
Rurik → Salakuljettajat: +61
Maija → Rurik: -43
Molemmilla on yhteys Jokisatamaan.
```

Tämä on erittäin hyödyllinen debuggaustyökalu, koska sen avulla näkee, miksi generaattori teki tietyn valinnan.

## Kehityksen eteneminen

### Vaihe 1: maailman tietorakenne

Määritellään maailman peruselementit ja niiden tallennusmuoto:

- hahmot
- lokaatiot
- ryhmät
- suhteet
- tavoitteet
- tarpeet
- salaisuudet
- muistot
- tapahtumat

Kaikki maailman tiedot tallennetaan yhteen serialisoitavaan `worldState`-objektiin.

### Vaihe 2: pienen maailman generointi

Generaattori luo pienen maailman, joka sisältää esimerkiksi:

- 6 hahmoa
- 3 lokaatiota
- 2 ryhmää
- hahmojen roolit, ominaisuudet ja tavoitteet
- hahmojen sijainnit ja ryhmäjäsenyydet

Maailman tulee olla niin pieni, että käyttäjä pystyy ymmärtämään sen henkilöt ja tärkeimmät yhteydet yhdellä silmäyksellä.

### Vaihe 3: suhteiden ja yhteisen historian generointi

Hahmojen ja ryhmien välille luodaan merkityksellisiä suhteita. Jokaisella suhteella tulee olla arvo ja selitys.

Esimerkiksi:

```text
Maija ei luota Rurikiin (-45), koska Rurik epäonnistui hänen tavaralähetyksensä suojelemisessa.

Rurik tuntee olevansa Maijalle palveluksen velkaa (+60), koska Maija pelasti hänet Vartijoilta.
```

Samalla generoidaan muutama maailmaa edeltävä tapahtuma, jotka selittävät nykyiset suhteet, velat, vihollisuudet ja salaisuudet.

### Vaihe 4: alkutilanteen konfliktien luominen

Generaattori varmistaa, että maailmassa on heti joitakin ratkaisemattomia ongelmia:

- maksamaton velka
- kadonnut tavaralähetys
- salainen rikos
- kahden ryhmän valtataistelu
- toteutumaton lupaus
- resurssipula
- ristiriitaiset tavoitteet

Näiden konfliktien tarkoitus on tehdä generoidusta maailmasta heti kiinnostava ja antaa myöhemmälle tapahtumageneraattorille lähtökohtia.

### Vaihe 5: uusien tapahtumien generointi

Kun maailma ja sen alkutilanne ovat olemassa, generaattori luo yksinkertaisia tapahtumia, kuten:

- riita
- ryöstö
- varkaus
- avunpyyntö
- uhkaus
- petos
- sovintoyritys
- salaisuuden paljastuminen

Tapahtumat eivät ole täysin satunnaisia. Niiden henkilöt, ryhmät ja lokaatiot valitaan maailman suhteiden, tavoitteiden ja konfliktien perusteella.

### Vaihe 6: tapahtumien seuraukset

Jokainen tapahtuma muuttaa maailman tilaa. Se voi vaikuttaa esimerkiksi:

- hahmojen välisiin suhteisiin
- hahmojen muistoihin
- hallussa olevaan tietoon
- tavoitteiden etenemiseen
- ryhmien välisiin suhteisiin
- lokaatioiden turvallisuuteen
- resurssien määrään
- aktiivisiin konflikteihin

Tapahtuma tallennetaan maailman historiaan, jotta sitä voidaan käyttää myöhempien tilanteiden ja tehtävien muodostamisessa.

### Vaihe 7: tilanteiden tunnistaminen

Story engine etsii maailmasta tilanteita, joissa on narratiivista potentiaalia. Se tarkastelee esimerkiksi:

- voimakasta vihamielisyyttä
- maksamattomia velkoja
- salaisuuksia ja todistajia
- ristiriitaisia tavoitteita
- resurssipulaa
- uhattuja hahmoja
- samassa paikassa olevia vihollisia
- ratkaisemattomia aikaisempia tapahtumia

Järjestelmä antaa tilanteille jännitearvon ja valitsee käsiteltäväksi kiinnostavimmat tilanteet.

### Vaihe 8: tehtävien muodostaminen

Havaittu tilanne muutetaan pelaajalle esitettäväksi tehtäväksi. Yhdestä tilanteesta voi syntyä useita mahdollisia toimintatapoja:

- auta yhtä osapuolta
- sovittele riita
- hanki puuttuva resurssi
- paljasta salaisuus
- peitä rikos
- kiristä osapuolta
- etsi vaihtoehtoinen ratkaisu

Tehtävän ratkaisu muuttaa jälleen maailman tilaa ja tuottaa uusia tapahtumia, muistoja, suhteita ja konflikteja.

### Vaihe 9: jatkuva maailman simulaatio

Kun perusketju toimii, maailma voi alkaa edetä päivissä tai vuoroissa:

```text
maailman tila
  → hahmojen tavoitteet
  → tapahtumat
  → seuraukset
  → tilanteet
  → tehtävät
  → pelaajan päätös
  → uusi maailman tila
```

Tavoitteena on, että tehtävät perustuvat ajan myötä yhä vähemmän satunnaisuuteen ja yhä enemmän maailman omaan historiaan.

## Idean ydin

Järjestelmän kiinnostavin ominaisuus on, että tehtävät lakkaavat vähitellen olemasta satunnaisia:

```text
satunnainen tehtävä
  → hahmot reagoivat
  → suhteet muuttuvat
  → historiaa kertyy
  → konflikteja syntyy
  → uudet tehtävät generoidaan konflikteista
```

Vaikka ensimmäinen tapahtuma olisi täysin satunnainen, myöhempi tehtävä voi olla looginen seuraus kokonaisesta tapahtumaketjusta. Ohjelma rakentaa vähitellen oman taustatarinansa.

Teknisesti projekti kannattaa aloittaa vanilla JavaScriptillä. Vaikein ja kiinnostavin osa ei ole käyttöliittymä, vaan sääntöketju:

```text
event → memory → relationship → tension → situation → quest
```
