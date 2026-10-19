# Global Herbs — varsam uppdatering

Sidan behåller originalets gröna och guldfärgade palett, logotyp, Avenir/Cormorant-typsnitt, huvudbild och elva galleribilder. Startsidan följer samma ordning som originalet. Nya funktioner ligger i menyn, AI-panelen och separata sidor för bokning och takeaway. Menytexten är 18 px på dator och 17 px på mobil, portioner 14 px och priser 18–19 px. Originalets bildfiler och färger har bevarats.

## Köra lokalt

Node 22.13+ krävs. Installera beroenden med `npm ci` och kör `npm run dev -- --port 5187`. På den här Windows-installationen kan npm vid behov köras med `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"`.

Kontroller: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` och `node scripts/check.mjs`. Bygg med `node scripts/run-framework.mjs build`.

## Vercel

`vercel.json` väljer Next.js, kör `npm ci` och `npm run build:vercel` och använder `.next` som byggresultat. Det ersätter Vercels automatiska ramverksdetektering; projektets vanliga `build`-kommando bygger fortfarande Cloudflare/Sites-versionen. Använd repots rot som Root Directory och `main` som produktionsgren i Vercel.

Testa Vercel-versionen lokalt med `npm run build:vercel` följt av `npm run start:vercel -- --port 5187`, eller `npm run dev:vercel -- --port 5187` under utveckling. `tsconfig.next.json` kontrollerar applikationen och Next.js genererade ruttyper utan att blanda in de separata Cloudflare- och offlineverktygen. TypeScript-fel kontrolleras även i produktionsbygget.

AI-rutten läser `OPENAI_API_KEY` och `OPENAI_MODEL` från serverns miljövariabler på båda plattformarna. På Vercel anges de i projektets Environment Variables och följs av en ny deployment. Saknas de visas fortsatt att AI inte är ansluten. Nycklar ska aldrig läggas i Git eller i `NEXT_PUBLIC_`-variabler. Vercel-versionen använder samma innehåll, språkförhandsvisningar och indexeringsregler som Sites-versionen. Takeaway är ett oskickat utkast. Bords- och gruppförfrågningar kan skickas via e-post enligt avsnittet nedan.

## Det som fungerar

- Mobilnavigation, anpassade layouter och tangentbordsvänliga dialoger.
- Menysökning, 28 kategorier, 166 mat- och dryckesposter och favoriter som sparas lokalt på besökarens enhet.
- Elva originalfoton i ett manuellt bläddringsbart galleri. Fullstora foton hämtas först när de öppnas.
- Öppetstatus utifrån Europe/Bucharest, inklusive helgernas öppethållande efter midnatt.
- `/order` är en inbyggd takeaway-meny med sökning, kategorier, antal, varukorg och ordergranskning. Varukorgen är ett lokalt utkast på besökarens enhet, med priser från menyfilen. Varukorgen valideras när den återställs; priser hämtas aldrig från webbläsarlagringen. Mobilvyn har en genväg till varukorgen.
- `/book` skickar bordsförfrågningar för 1–10 personer och gruppförfrågningar för 11 eller fler via `/api/bookings`. Gästen granskar först uppgifterna och väljer sedan att skicka. Tiderna följer publicerade öppettider, inklusive tisdagens stängning och helgernas tider efter midnatt. De påstås aldrig vara tillgängliga bord.
- Båda sidorna använder samma navigation, typsnitt, färger och originalbilder som resten av webbplatsen. De innehåller inga iframes eller automatiska övergångar till den äldre Wix-webbplatsen.
- **Takeaway är en förhandsvisning:** ingen beställning skickas. **Bokning sker som en förfrågan:** restaurangen tar emot ett mejl och bekräftar manuellt via gästens e-post eller telefon. Inget bord reserveras automatiskt, och ingen betalning tas. Kontaktuppgifter sparas inte i webbläsarens localStorage.

## Bords- och gruppförfrågningar via e-post

Mottagare och formulärets adress anges endast på serversidan i `app/api/bookings/route.ts`. Mottagaren kan inte ändras genom att manipulera formuläret. E-post skickas genom [FormSubmit](https://formsubmit.co/documentation), vars aktiveringslänk måste bekräftas av mottagaren. Formuläret använder samma formuläradress och Referer för alla anrop. En avvisad aktivering, leveransfel eller okänt leveransresultat visas aldrig som en lyckad förfrågan.

- 1–10 personer: datum, önskad tid, namn, e-post, telefon och valfria önskemål.
- 11+ personer: eget antal med snabbval för 15, 30 och 60, datum-/tidsflexibilitet, tillfälle, önskemål om gruppmeny och valfri budget per person i RON. Antalsfältets tekniska gräns 999 är ingen uppgift om lokalens kapacitet. Kapacitet, placering, meny och pris måste avtalas med restaurangen.
- Mejlets ämne skiljer gruppförfrågningar från vanliga bordsförfrågningar. Mejlet innehåller alla uppgifter, en referens och en tydlig markering om att förfrågan inte är bekräftad. Reply-To är gästens validerade e-postadress. Ingen automatisk bekräftelse skickas till gästens inkorg; kvittensen visas på webbsidan.
- Backend validerar datum, tider, kontaktuppgifter, antal och fältlängder, begränsar begäransstorleken och kontrollerar origin och ett dolt spamfält. Dubbelklick spärras i gränssnittet. En processlokal referenscache förhindrar samtidiga dubletter och omedelbar omsändning vid okänt leveransresultat. En lokal spärr tillåter fem förfrågningar per IP och 15 minuter. Dessa minnesbaserade skydd delas inte mellan Vercel-instanser; använd referensen för att känna igen dubletter i inkorgen. Vid större trafik bör Vercels brandvägg eller en gemensam lagring användas för en distribuerad gräns.
- Kontaktuppgifterna skickas till mejlleverantören och restaurangens inkorg. Ingen egen bokningsdatabas eller serverlogg med formulärinnehållet skapas. FormSubmit anger att inskickade formulär lagras i deras arkiv i 30 dagar. Restaurangen hanterar uppgifterna i sin inkorg och svarar gästen manuellt.

`scripts/booking-checks.ts` testar validering, 10/11-gränsen, 30/60 personer, e-postpayload, manipulation, dubbelklick, leveransfel, aktivering och anropsbegränsning med en simulerad leverantör. Automatiska tester skickar aldrig riktiga mejl. Den tidigare levererade offline-ZIP-filen har inte uppdaterats till aktiv mejlbokning.

## Språk för granskning

Engelska är fortfarande standardspråk. Rumänska (`ro`) och nepali (`ne`, devanagarisk skrift) finns på startsidan, menyn, takeaway- och bokningssidorna samt i AI-panelen. Det finns ingen synlig språkknapp, automatisk språkdetektering eller sparad språkpreferens.

Förhandsgranska med `?lang=ro` eller `?lang=ne`, till exempel `/menu?lang=ro` och `/book?lang=ne`. Interna länkar behåller språket, sökparametrar och ankarlänkar. Den vanliga adressen utan `lang` visar engelska. Okända eller upprepade språkparametrar faller tillbaka till engelska. Innehållet renderas på servern på valt språk; sidtitlar och tillgänglighetsetiketter följer samma språk. Språkförhandsvisningarna är markerade `noindex` tills restaurangen vill göra dem synliga.

`app/data/translations.ts` och `app/data/menu-translations.ts` innehåller översättningarna. Produktnamn för internationella drycker behålls. Meny-ID:n, priser, mängder och sparade favoriter/varukorgar delas mellan språken. Sökningen accepterar både originalnamn och översatta namn, även rumänska utan diakritiska tecken, och behåller nepaliska vokaltecken. Datum använder gregoriansk kalender och tider fortsätter följa Europe/Bucharest. Priserna är alltid i RON.

Noto Sans/Serif Devanagari laddas från egna fontfiler bara där skriften behöver dem; originalets Avenir/Cormorant används fortsatt för latinsk text. SIL OFL-licenserna finns i `public/licenses/` och källorna i `asset-sources.json`. AI-panelen skickar en validerad språkpreferens när assistenten är aktiverad; språkstödet aktiverar inte AI eller boknings-/ordermottagningen.

Översättningarna kan granskas via direktlänkarna innan en språkknapp läggs till. Den tidigare levererade lokala ZIP-versionen är oförändrad.

## AI-stöd och aktivering

`app/api/assistant/route.ts` tar emot GET för status och POST för frågor. `app/lib/assistant-server.ts` ansluter till OpenAI Responses API på serversidan. Nyckeln skickas aldrig till webbläsaren. Restauranginformationen och den lokala menyn skickas som faktaunderlag. Assistenten får inte hitta på allergeninformation eller påstå att den har bokat bord.

AI är avstängd tills båda servervariablerna finns:

- `OPENAI_API_KEY`: hemlig API-nyckel, anges genom Sites hemlighetshantering.
- `OPENAI_MODEL`: en textmodell med stöd för Responses API som finns tillgänglig för restaurangens OpenAI-projekt.

På Sites används OpenAI Developers-pluginens nyckelflöde för att koppla API-kontot och därefter Sites miljövariabler. Lägg aldrig nyckeln i källkod, `.openai/hosting.json`, en NEXT_PUBLIC-variabel eller chatten. Exempelvärden finns i `.env.example`. För lokal Worker-utveckling kan inställningarna anges i en ignorerad `.dev.vars`.

Knappen **Ask the AI menu assistant** finns högst upp på menyn. Startsidan har samma funktion vid matgalleriet och i sidfoten. UI skiljer mellan saknad konfiguration och tillfälligt anslutningsfel, med återförsök för anslutningsfel. När AI saknas visas tydligt **Not connected yet**, samt menysökningar, kontakt, bokning och takeaway. Dessa genvägar är vanliga länkar, inte AI-svar. Live-AI ska sluttestas med en riktig konfiguration innan den tas i bruk; nuvarande tester använder en simulerad API-respons och inga betalda anrop.

Gränser: upp till 1 000 tecken per meddelande, högst åtta historikmeddelanden, begränsad begäranstorlek, timeout och åtta anrop/minut per identifierare inom en Worker-instans. Den lokala begränsningen är inte en global kostnadskvot. Sätt projektets API-budget och använd en distribuerad gräns om sidan senare öppnas för en större publik. Sidan är privat vid första publicering.

## Ändra innehåll och bygga vidare

- `app/data/menu.json`: meny, priser, storlekar och kategorier; gemensamt underlag för menyn och AI.
- `app/data/restaurant.ts`: kontakt, länkar, öppettider och bildlista.
- `app/ui/`: startsida, meny, navigation, `order.tsx`, `booking.tsx`, gemensamma servicekomponenter och AI-panel.
- `app/lib/service-drafts.ts`: validering av varukorgsutkast, summering och datum/tid enligt Europe/Bucharest.
- `app/globals.css`: färger, typografi och responsiva regler.
- `app/lib/assistant-server.ts`: avgränsad AI-anslutning som kan utökas när faktiska boknings-/ordersystem kopplas in.

Ett framtida CMS kan ersätta de två datafilerna utan att byta sidans visuella form. Mejlbokningen kräver ingen Wix-anslutning, men visar inte lediga bord. För automatiskt bekräftade bokningar behövs restaurangens faktiska inventarie-/bokningssystem. För aktiv takeaway behövs katalog-ID:n, aktuella priser, lager/utbud, upphämtning och betalningssätt. Wix [Reservations API](https://dev.wix.com/docs/api-reference/business-solutions/restaurants/reservations/reservations/introduction) stödjer bokningsplatser, tillgängliga tider och skapande av reservationer. Ingen betalningstjänst har skapats.

## Källor

Restaurangens [originalsida](https://www.globalherbsrestaurantsandbar.com/) och [meny](https://www.globalherbsrestaurantsandbar.com/menu), kontrollerade 18 oktober 2026. Priser och tillgänglighet behöver fortsatt bekräftas av restaurangen. Rätternas namn och fakta är hämtade därifrån; de längre maträttsbeskrivningarna länkas till originalet. Hookah-avsnittet ingår inte i mat- och dryckesmenyn.

Bild- och typsnittskällorna dokumenteras i `asset-sources.json`. Bilderna är hämtade från originalsidans Wix-filer, utan generativ bearbetning. Thumbnail-varianterna är originalsidans redan publicerade varianter.

AI-protokollet följer [OpenAI Responses-dokumentationen](https://developers.openai.com/api/docs/guides/migrate-to-responses). `store: false` används för anropen; besökarens konversation sparas inte i denna applikations databas.


## Verifiering och drift

- TypeScript och 30 tester för språk, varukorg, bokningsförfrågningar, mejlfel, AI, menyalternativ, öppettider och SEO. SEO-kontrollerna täcker även nattöppet, dolda språk, prisvarianter, indexeringsregler och säker JSON-LD-serialisering.
- Webbläsarkontroll av sökning, varukorg, antal, summering, återställning, redigering, formulärvalidering och bokningsgranskning på dator och mobil. Inga riktiga beställningar, betalningar eller slutförda bokningar ska skickas som tester.
- Ägaråtgärd: Wix visade bokningsbara tider från 11:00 måndag 19 oktober 2026, medan publicerade öppettider anger 15:00. Kontrollera bokningsschemat i Wix innan sidan delas med gäster.
- Restaurangen bekräftar varje bokningsförfrågan manuellt. Före aktivering av takeaway ska utbud, priser, meddelanden och betalningssätt verifieras; ordergranskningen är fortfarande ett oskickat utkast.

## SEO och synlighet i AI-sökning

Optimeringen gäller **Global Herbs i Bukarest, Rumänien**. Sidans faktaunderlag är originalrestaurangens adress och telefon, nepalesiska kök, publicerade öppettider och meny. Inga betyg, recensioner, utmärkelser eller placeringar har lagts till. Kontakt och öppettider kontrollerades mot originalets startsida 19 oktober 2026; menypriserna har datumet i `restaurant.menuChecked`.

- Startsidan och menyn har unika titlar och beskrivningar. Canonical och delningsmetadata är förberedda för `https://www.globalherbsrestaurantsandbar.com`.
- Restaurant, WebSite och WebPage finns som JSON-LD. Menysidan har Menu, MenuSection och samtliga 166 MenuItem/Offer-poster, inklusive portion och pris i RON. Dessa hämtas från samma menyfil som gästerna läser. Varje rätt har en direkt ankarlänk. Filtrerade sök-URL:er annonserar ingen fullständig meny i JSON-LD.
- Adress, telefon, officiella sociala profiler och öppettider delar sidans faktakällor. Tisdag är stängt. Lördagens och söndagens 01:00 avser följande morgon. Det finns inga påståenden om bokningsbara bord, beställningar eller allergensäker mat i strukturerade data.
- Alla rätter finns i serverns HTML redan före JavaScript. Startsidan har en kort besöksdel med synliga svar om plats, mat, öppettider och kontakt. Den använder samma typsnitt och färger som resten av sidan och är även översatt till rumänska och nepali.

**Nuvarande status: privat förhandsvisning.** `app/data/search-config.ts` har `publicLaunch: false`. HTML är `noindex`; robots.txt stoppar genomsökning och sitemap.xml listar ännu inga adresser. Det undviker att arbetskopian börjar konkurrera med restaurangens riktiga webbplats. SEO-koden är färdig att aktivera vid lansering, men ändrar inte den nuvarande Wix-sidan, Google Företagsprofil eller vem som kan se Sites-versionen.

Vid en godkänd offentlig lansering behöver webbansvarig:

1. Kontrollera namn, adress, telefon, samtliga öppettider, priser och aktuell meny med ägaren. Behåll befintliga fungerande Wix-tjänster och adresser under flytten; takeaway är ännu ett utkast och mejlbokningar kräver manuell hantering.
2. Driftsätta på den officiella domänen, ordna omdirigeringar för gamla URL:er och välja en enda huvudadress för www/utan www. Canonical-domänen i `search-config.ts` ska motsvara den faktiska domänen och bildernas URL:er måste fungera där.
3. Sätta `publicLaunch: true`, bygga och publicera. Startsidan och `/menu` får då indexeras och finns i sitemap.xml. `robots.txt` tillåter vanliga sökrobotar och OAI-SearchBot, men inte API-rutter. Order/bokning samt `q`- och `lang`-förhandsvisningar förblir `noindex`. Först efter språkgranskning och ett separat beslut bör översättningarna få indexeras och läggas till i hreflang/sitemap. Ingen språkknapp har lagts till.
4. Kontrollera att hosting, brandvägg och inloggningsskydd faktiskt släpper fram offentliga besökare och sökrobotar. Att bara ändra robots.txt öppnar inte en privat Sites-sida.
5. Verifiera domänen i Google Search Console och Bing Webmaster Tools, skicka in `/sitemap.xml` och kontrollera hemsidan och menyn med URL-granskning. Granska Restaurant-markeringen i Googles Rich Results Test. Följ upp indexering och sökvisningar; ingen viss placering kan garanteras.
6. Se över restaurangens Google Företagsprofil: rätt kategori, adress, telefon, menyadress, öppettider och egna foton. Be verkliga gäster om ärliga recensioner och svara på dem. Kontrollera samma grunduppgifter på restaurangens sociala profiler och lokala kataloger.

Tekniska kontroller mot en körande förhandsvisning: `node scripts/check-seo-pages.mjs http://127.0.0.1:5187`. Efter den offentliga lanseringen: `node scripts/check-seo-pages.mjs https://www.globalherbsrestaurantsandbar.com --public`. Kontrollen läser endast sidor, metadata, meny och indexeringsfiler; den skickar inga formulär och gör inga AI-anrop.

Google beskriver att [vanlig SEO och läsbart, pålitligt innehåll även gäller för AI-sökning](https://developers.google.com/search/docs/appearance/ai-features). OpenAI beskriver [OAI-SearchBot som sökroboten för ChatGPT](https://developers.openai.com/api/docs/bots); tillgång till den innebär ingen garanti om rekommendationer. [Google Företagsprofil](https://support.google.com/business/answer/7091?hl=sv) beskriver relevans, avstånd och popularitet som faktorer för lokal synlighet. [Bing](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a) rekommenderar läsbart innehåll, interna länkar och en aktuell sitemap för sök- och AI-upplevelser. Webbplatsen behöver ingen påhittad AI-ranking, dold reklamtext eller särskild AI-textfil för detta.
