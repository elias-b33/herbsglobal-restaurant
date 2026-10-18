# Global Herbs — varsam uppdatering

Sidan behåller originalets gröna och guldfärgade palett, logotyp, Avenir/Cormorant-typsnitt, huvudbild och elva galleribilder. Startsidan följer samma ordning som originalet. Nya funktioner ligger i menyn, AI-panelen och separata sidor för bokning och takeaway. Menytexten är 18 px på dator och 17 px på mobil, portioner 14 px och priser 18–19 px. Originalets bildfiler och färger har bevarats.

## Köra lokalt

Node 22.13+ krävs. Installera beroenden med `npm ci` och kör `npm run dev -- --port 5187`. På den här Windows-installationen kan npm vid behov köras med `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"`.

Kontroller: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` och `node scripts/check.mjs`. Bygg med `node scripts/run-framework.mjs build`.

## Det som fungerar

- Mobilnavigation, anpassade layouter och tangentbordsvänliga dialoger.
- Menysökning, 28 kategorier, 166 mat- och dryckesposter och favoriter som sparas lokalt på besökarens enhet.
- Elva originalfoton i ett manuellt bläddringsbart galleri. Fullstora foton hämtas först när de öppnas.
- Öppetstatus utifrån Europe/Bucharest, inklusive helgernas öppethållande efter midnatt.
- `/order` visar restaurangens riktiga Wix-meny, varukorg och checkout i en inbäddad helskärmsvy. `/book` visar tillgängliga tider och formuläret för gästuppgifter från Wix. Alla knappar på den nya sidan leder hit.
- En enkel verktygsrad låter gästen gå tillbaka till den nya sidan eller öppna tjänsten separat. Den senare vägen finns alltid som reserv om webbläsaren blockerar inbäddat innehåll.
- Restaurangen tar emot beställningar och bokningar i sitt befintliga Wix-system. Ingen dubbel orderdatabas, lokal låtsasvarukorg eller simulerad bokningsbekräftelse har skapats.

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
- `app/ui/`: startsida, meny, navigation, `service-flow.tsx` för Wix-flöden och AI-panel.
- `app/globals.css`: färger, typografi och responsiva regler.
- `app/lib/assistant-server.ts`: avgränsad AI-anslutning som kan utökas när faktiska boknings-/ordersystem kopplas in.

Ett framtida CMS kan ersätta de två datafilerna utan att byta sidans visuella form. En helt egen design på checkout och bokningsformulär kräver en behörig Wix API-/Headless-anslutning från restaurangägaren. Nuvarande implementation bäddar in de publicerade Wix-sidorna och behåller deras riktiga funktioner och originalutseende. Wix stöder inte felsökning av externa inbäddningar, därför finns alltid en direktlänk som reserv. Vi tar inte bort säkerhetsrubriker eller proxar deras formulär. Inga simulerade bokningsbekräftelser eller betalningar förekommer.

## Källor

Restaurangens [originalsida](https://www.globalherbsrestaurantsandbar.com/) och [meny](https://www.globalherbsrestaurantsandbar.com/menu), kontrollerade 18 oktober 2026. Priser och tillgänglighet behöver fortsatt bekräftas av restaurangen. Rätternas namn och fakta är hämtade därifrån; de längre maträttsbeskrivningarna länkas till originalet. Hookah-avsnittet ingår inte i mat- och dryckesmenyn.

Bild- och typsnittskällorna dokumenteras i `asset-sources.json`. Bilderna är hämtade från originalsidans Wix-filer, utan generativ bearbetning. Thumbnail-varianterna är originalsidans redan publicerade varianter.

AI-protokollet följer [OpenAI Responses-dokumentationen](https://developers.openai.com/api/docs/guides/migrate-to-responses). `store: false` används för anropen; besökarens konversation sparas inte i denna applikations databas.


## Verifiering och drift

- TypeScript och åtta tester för AI-validering, felhantering, begränsning av anrop, menyalternativ och öppettider.
- Webbläsarkontroll av större text, sökning, mobilvy, AI-status, bokningsflöde och takeaway. Inga riktiga beställningar, betalningar eller slutförda bokningar ska skickas som tester.
- Ägaråtgärd: Wix visade bokningsbara tider från 11:00 måndag 19 oktober 2026, medan publicerade öppettider anger 15:00. Kontrollera bokningsschemat i Wix innan sidan delas med gäster.
- Inbäddade Wix-formulär följer Wix egna priser, tillgänglighet, bekräftelser, personuppgiftshantering och betalningsinställningar. Den nya sidan läser inte kunduppgifterna i iframen och hävdar aldrig själv att en beställning eller bokning har bekräftats.
- Framtida flytt av restaurangens domän måste bevara de Wix-adresser som dessa flöden använder, eller ersätta integrationen. Byt inte domän utan att först säkra tjänsteadresserna.
