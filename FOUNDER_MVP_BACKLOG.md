# Founder Community MVP Backlog

Stand: Mai 2026  
Ziel: Eigene Founder Community Web-App als mobile-first MVP fuer Deutschland.

## 1. MVP-Ziel

Der MVP soll beweisen, dass Gruender und Unternehmer einer verifizierten Community beitreten, aktiv teilnehmen und ueber Events, Mentoren und optionale Pro-Funktionen monetarisierbar sind.

Der Fokus liegt auf:

- Registrierung und Onboarding
- Rangbasierter Verifikation
- Kostenloser Community-Zugang nach Verifikation
- Optionales Founder Pro Upgrade
- Geschuetzter Community-Struktur
- Einfacher Event-Funktion
- Admin-Prozessen fuer Verifikation und Mitgliederverwaltung

Nicht Ziel des MVP:

- Native Mobile App
- Vollstaendiger Mentoren-Marktplatz
- Stripe Connect Payouts
- Automatische Dokumentenpruefung
- Komplexes Affiliate-Auszahlungssystem
- Mehrsprachige UI

## 2. Produktprinzipien

### Rang und Zahlung bleiben getrennt

Ein Nutzer kann Founder Pro kaufen, aber keinen Rang kaufen. Der Rang entsteht nur durch Verifikation.

Beispiel:

- User kauft Founder Pro fuer 9,99 EUR monatlich.
- User ist aber nur als Starter verifiziert.
- Ergebnis: Pro-Funktionen aktiv, aber Rang-Zugang bleibt auf Starter-Niveau.

### Mobile-first

Die Mehrheit der Nutzer kommt ueber TikTok und Social Media. Alle Kernflows muessen auf dem Smartphone sauber funktionieren.

### Manuelle Verifikation im MVP

Automatisierung kommt spaeter. Im MVP ist ein schneller, sauberer Admin-Prozess wichtiger als komplexe KI- oder OCR-Pruefung.

### Premium statt Startup-Klischee

Design und Sprache sollen serioes, vertrauenswuerdig und unternehmerisch wirken.

## 3. Empfohlener MVP-Stack

- Frontend: Next.js 14 App Router
- Styling: Tailwind CSS
- Auth: Supabase Auth
- Database: PostgreSQL ueber Supabase
- ORM: Prisma
- Storage: Supabase Storage fuer Verifikationsdokumente
- Payments: Stripe Checkout, Stripe Customer Portal, Stripe Webhooks
- E-Mail: Resend oder SendGrid
- Hosting: Vercel
- Analytics: Plausible oder PostHog
- Chat MVP: interne Channel/Post-Loesung oder Stream Chat, wenn schnelle Chat-Qualitaet wichtiger ist

Fuer einen schnellen MVP ist eine Next.js-Fullstack-App einfacher als getrenntes Frontend und Express-Backend.

## 4. Rollen und Zugriffsmodell

### Systemrollen

- `member`: normales Mitglied
- `moderator`: kann Community-Inhalte moderieren
- `admin`: kann Verifikationen, Mitglieder, Events und Abos verwalten
- `owner`: voller Zugriff auf alle Admin-Funktionen

### Ranks

- `aspiring`
- `starter`
- `builder`
- `scaler`
- `elite`

### Membership Plans

- `free`
- `starter_monthly`
- `starter_yearly`
- `builder_monthly`
- `builder_yearly`
- `scaler_monthly`
- `scaler_yearly`
- `elite_monthly`
- `elite_yearly`

### Access Rules

- Channel-Zugriff basiert primaer auf verifiziertem Rang.
- Zahlungsstatus entscheidet, ob ein Mitglied Zugriff auf bezahlte Plattformfunktionen hat.
- Admins koennen alle Bereiche sehen.
- Aspiring ist kostenlos, aber ohne Verifikation auf Basisbereiche begrenzt.

## 5. MVP-Screens

### Public

- `/`: Landing Page mit USP, Rangen, Preisen, CTA
- `/login`: Login
- `/register`: Registrierung
- `/verified/[username]`: oeffentliches Verified-Profil, optional P1
- `/privacy`: Datenschutz
- `/terms`: AGB
- `/imprint`: Impressum

### Member

- `/dashboard`: Uebersicht, Status, naechste Schritte
- `/onboarding`: Profildaten und geschaetzter Rang
- `/profile`: eigenes Profil
- `/profile/verify`: Dokumenten-Upload
- `/community`: Channel-Liste
- `/community/[channel]`: Channel-Ansicht
- `/events`: Event-Uebersicht
- `/events/[id]`: Event-Detail und Anmeldung
- `/settings`: Konto, Abo, Datenschutz
- `/billing`: Stripe Billing Portal Einstieg

### Admin

- `/admin`: Admin-Uebersicht
- `/admin/verifications`: Verifikations-Warteschlange
- `/admin/verifications/[id]`: Dokumente pruefen, Rang zuweisen, ablehnen
- `/admin/members`: Mitgliederverwaltung
- `/admin/members/[id]`: Mitgliedsdetails
- `/admin/events`: Events verwalten
- `/admin/revenue`: einfache Umsatzmetriken

## 6. Datenmodell

### User

- `id`
- `email`
- `role`
- `created_at`
- `last_login_at`
- `is_banned`

### Profile

- `id`
- `user_id`
- `username`
- `display_name`
- `avatar_url`
- `company_name`
- `industry`
- `location`
- `bio`
- `website_url`
- `linkedin_url`
- `instagram_url`
- `current_rank`
- `created_at`
- `updated_at`

### VerificationRequest

- `id`
- `user_id`
- `requested_rank`
- `status`
- `submitted_at`
- `reviewed_at`
- `reviewed_by`
- `assigned_rank`
- `rejection_reason`
- `next_review_due_at`

Statuswerte:

- `draft`
- `pending`
- `approved`
- `rejected`
- `expired`

### VerificationDocument

- `id`
- `verification_request_id`
- `document_type`
- `storage_path`
- `file_name`
- `mime_type`
- `uploaded_at`

Dokumenttypen:

- `business_registration`
- `bwa`
- `tax_assessment`
- `commercial_register`
- `annual_financial_statement`

### Subscription

- `id`
- `user_id`
- `stripe_customer_id`
- `stripe_subscription_id`
- `plan`
- `status`
- `billing_interval`
- `current_period_start`
- `current_period_end`
- `cancel_at_period_end`

### Channel

- `id`
- `slug`
- `name`
- `category`
- `description`
- `min_rank`
- `is_private`
- `is_archived`
- `created_by`

### Post

- `id`
- `channel_id`
- `author_id`
- `content`
- `created_at`
- `updated_at`
- `deleted_at`

### Event

- `id`
- `title`
- `slug`
- `description`
- `starts_at`
- `ends_at`
- `location_type`
- `location_text`
- `online_url`
- `min_rank`
- `price_cents`
- `capacity`
- `status`
- `created_by`

### EventRegistration

- `id`
- `event_id`
- `user_id`
- `status`
- `registered_at`

### AdminActionLog

- `id`
- `admin_user_id`
- `target_user_id`
- `action`
- `metadata`
- `created_at`

## 7. Priorisiertes Ticket-Backlog

### Epic 1: Projektfundament

#### FND-001: Next.js App Setup

Prioritaet: P0  
Ziel: Technische Basis fuer die Web-App schaffen.

Akzeptanzkriterien:

- Next.js 14 App Router ist eingerichtet.
- Tailwind CSS ist konfiguriert.
- Basislayout mit Header, Footer und Mobile Navigation existiert.
- Environment-Variablen sind dokumentiert.
- Deployment auf Vercel ist vorbereitet.

#### FND-002: Design Tokens und Branding

Prioritaet: P0  
Ziel: Founder Branding konsistent nutzbar machen.

Akzeptanzkriterien:

- Royal Blue `#1a3aad` ist als Primary Color definiert.
- Rank-Farben sind als Tokens definiert.
- Headline-Schrift nutzt Serif-Stack.
- Body-Schrift nutzt Sans-Serif-Stack.
- Basis-Komponenten fuer Button, Card, Badge, Input existieren.

#### FND-003: Datenbank und Prisma Setup

Prioritaet: P0  
Ziel: Persistenzschicht fuer MVP-Features vorbereiten.

Akzeptanzkriterien:

- Prisma ist mit PostgreSQL verbunden.
- Erste Migration enthaelt User-nahe Tabellen, Profile, Ranks und Verification.
- Seed-Script legt Standard-Channels und Test-Admin an.

### Epic 2: Auth und Onboarding

#### AUTH-001: Registrierung und Login

Prioritaet: P0  
Ziel: Nutzer koennen sich anmelden und einloggen.

Akzeptanzkriterien:

- Registrierung per E-Mail funktioniert.
- Login und Logout funktionieren.
- Auth Session wird serverseitig validiert.
- Geschuetzte Seiten leiten nicht eingeloggte Nutzer zu `/login`.

#### AUTH-002: Onboarding Flow

Prioritaet: P0  
Ziel: Neue Nutzer geben Basisdaten und geschaetzten Rang an.

Akzeptanzkriterien:

- User sieht Onboarding nach erster Registrierung.
- Profilfelder werden gespeichert.
- User waehlt einen geschaetzten Rang.
- Nach Abschluss landet User im Dashboard.

#### AUTH-003: Role Guards

Prioritaet: P0  
Ziel: Admin- und Member-Bereiche sind sauber getrennt.

Akzeptanzkriterien:

- Admin-Routen sind nur fuer `admin` und `owner` erreichbar.
- Member-Routen sind nur fuer eingeloggte User erreichbar.
- Gebannte User koennen keine geschuetzten Bereiche nutzen.

### Epic 3: Verifikation

#### VER-001: Verifikationsformular

Prioritaet: P0  
Ziel: Nutzer koennen Dokumente fuer ihren gewuenschten Rang hochladen.

Akzeptanzkriterien:

- User waehlt gewuenschten Rang.
- UI zeigt benoetigte Dokumente je Rang.
- Dokumente werden in Supabase Storage gespeichert.
- VerificationRequest wird mit Status `pending` erstellt.
- User sieht nach Upload den Pruefstatus.

#### VER-002: Admin Verifikationsqueue

Prioritaet: P0  
Ziel: Admins koennen eingereichte Verifikationen bearbeiten.

Akzeptanzkriterien:

- Admin sieht Liste offener Requests.
- Admin sieht User-Profil, gewuenschten Rang und Dokumente.
- Admin kann Request genehmigen und Rang zuweisen.
- Admin kann Request mit Begruendung ablehnen.
- Aktion wird im AdminActionLog gespeichert.

#### VER-003: Verifikationsbenachrichtigungen

Prioritaet: P0  
Ziel: Nutzer werden ueber Statusaenderungen informiert.

Akzeptanzkriterien:

- E-Mail bei erfolgreichem Upload an User.
- E-Mail bei neuem Request an Admin.
- E-Mail bei Genehmigung an User.
- E-Mail bei Ablehnung inklusive Begruendung an User.

#### VER-004: Jahres-Reverification Feld

Prioritaet: P1  
Ziel: Spaetere automatische Re-Verifikation vorbereiten.

Akzeptanzkriterien:

- Approved Requests setzen `next_review_due_at` auf 12 Monate spaeter.
- Admin kann faellige Re-Verifikationen in einer Liste sehen.

### Epic 4: Founder Pro und Zahlung

#### PAY-001: Stripe Produktstruktur

Prioritaet: P0  
Ziel: Optionales Founder Pro Upgrade in Stripe abbilden.

Akzeptanzkriterien:

- Founder Pro Preis fuer 9,99 EUR monatlich ist angelegt.
- Preis-IDs sind als Environment-Variablen dokumentiert.
- Community-Zugang und Ränge brauchen kein Stripe Checkout.

#### PAY-002: Checkout Flow

Prioritaet: P0  
Ziel: Nutzer koennen Founder Pro optional kaufen.

Akzeptanzkriterien:

- Founder Pro CTA startet Stripe Checkout.
- Erfolgreiche Zahlung fuehrt zur App zurueck.
- Abgebrochene Zahlung fuehrt zur Founder Pro Sektion zurueck.

#### PAY-003: Stripe Webhooks

Prioritaet: P0  
Ziel: Subscription Status wird verlaesslich synchronisiert.

Akzeptanzkriterien:

- `checkout.session.completed` wird verarbeitet.
- `customer.subscription.updated` wird verarbeitet.
- `customer.subscription.deleted` wird verarbeitet.
- Subscription-Datensatz wird korrekt aktualisiert.

#### PAY-004: Billing Portal

Prioritaet: P1  
Ziel: Nutzer koennen Abo und Zahlungsmethode selbst verwalten.

Akzeptanzkriterien:

- User kann Stripe Billing Portal aus Settings oeffnen.
- Portal-Link wird serverseitig erzeugt.

### Epic 5: Dashboard und Profil

#### DASH-001: Member Dashboard

Prioritaet: P0  
Ziel: Nutzer sehen Status und naechste Schritte.

Akzeptanzkriterien:

- Dashboard zeigt aktuellen Rang.
- Dashboard zeigt Membership Status.
- Dashboard zeigt Verifikationsstatus.
- Dashboard zeigt empfohlene naechste Aktion.

#### PROF-001: Profil bearbeiten

Prioritaet: P0  
Ziel: Nutzer koennen ihr Profil pflegen.

Akzeptanzkriterien:

- User kann Name, Unternehmen, Branche, Standort, Bio und Links bearbeiten.
- Username ist eindeutig.
- Profilbild kann hochgeladen werden.

#### PROF-002: Verified Public Profile

Prioritaet: P1  
Ziel: Mitglieder koennen ein oeffentliches Verified-Profil teilen.

Akzeptanzkriterien:

- `/verified/[username]` zeigt Name, Unternehmen, Rang und Badge.
- Nur verifizierte User bekommen ein Verified Badge.
- User kann oeffentliche Sichtbarkeit deaktivieren.

### Epic 6: Community

#### COM-001: Channel Seed Struktur

Prioritaet: P0  
Ziel: Standard-Community-Struktur wird angelegt.

Akzeptanzkriterien:

- Info-, Onboarding-, Community-, Branchen-, Wissen-, Premium-, Elite-, Events-, Mentoren-, Jobs- und Challenges-Kategorien sind vorbereitet.
- Jeder Channel hat `min_rank`.
- Builder+ Channels sind fuer niedrigere Raenge nicht sichtbar.

#### COM-002: Channel Liste

Prioritaet: P0  
Ziel: Nutzer sehen nur erlaubte Channels.

Akzeptanzkriterien:

- Channel-Liste filtert nach verifiziertem Rang.
- Gesperrte Channels koennen optional als Upgrade/Verify-Hinweis angezeigt werden.
- Mobile Navigation ist gut nutzbar.

#### COM-003: Post MVP

Prioritaet: P0  
Ziel: Nutzer koennen in Channels posten.

Akzeptanzkriterien:

- User kann Textpost erstellen.
- User kann eigene Posts bearbeiten.
- User kann eigene Posts loeschen.
- Channel zeigt Posts chronologisch oder reverse-chronologisch.

#### COM-004: Moderation Basics

Prioritaet: P1  
Ziel: Admins koennen Inhalte moderieren.

Akzeptanzkriterien:

- Admin kann Posts loeschen.
- Admin kann User sperren.
- Geloeschte Posts bleiben auditierbar.

### Epic 7: Events

#### EVT-001: Event Liste

Prioritaet: P0  
Ziel: Mitglieder sehen passende Events.

Akzeptanzkriterien:

- Event-Liste zeigt kommende Events.
- Events werden nach Rang-Zugang gefiltert.
- Event-Karten zeigen Datum, Titel, Typ und Zugang.

#### EVT-002: Event Detail und Anmeldung

Prioritaet: P0  
Ziel: Nutzer koennen sich fuer kostenlose Events anmelden.

Akzeptanzkriterien:

- Detailseite zeigt Beschreibung, Datum, Ort/Online-Link und Zugang.
- Berechtigte User koennen sich anmelden.
- User sieht Anmeldestatus.
- Kapazitaet wird beruecksichtigt.

#### EVT-003: Admin Event Management

Prioritaet: P0  
Ziel: Admins koennen Events erstellen und verwalten.

Akzeptanzkriterien:

- Admin kann Event erstellen.
- Admin kann Event bearbeiten.
- Admin kann Event absagen.
- Admin sieht Registrierungen.

#### EVT-004: Bezahlte Event Tickets

Prioritaet: P1  
Ziel: Einmalzahlungen fuer Events vorbereiten.

Akzeptanzkriterien:

- Bezahltes Event startet Stripe Checkout.
- Erfolgreiche Zahlung erzeugt EventRegistration.
- Ticket-Status wird gespeichert.

### Epic 8: Admin

#### ADM-001: Admin Dashboard

Prioritaet: P0  
Ziel: Admins sehen operative Kernmetriken.

Akzeptanzkriterien:

- Dashboard zeigt neue Nutzer.
- Dashboard zeigt offene Verifikationen.
- Dashboard zeigt aktive Subscriptions.
- Dashboard zeigt kommende Events.

#### ADM-002: Mitgliederverwaltung

Prioritaet: P0  
Ziel: Admins koennen Mitglieder pruefen und verwalten.

Akzeptanzkriterien:

- Admin sieht Mitgliederliste mit Filter nach Rang, Status und Abo.
- Admin kann Mitgliedsdetails oeffnen.
- Admin kann User sperren oder entsperren.
- Admin kann Rang manuell korrigieren.

#### ADM-003: Umsatzuebersicht

Prioritaet: P1  
Ziel: Founder sieht einfache Revenue-Kennzahlen.

Akzeptanzkriterien:

- Anzeige von MRR, ARR, aktiven Abos und gekuendigten Abos.
- Daten basieren auf Subscription-Tabelle.
- Exakte Stripe-Finanzreports bleiben in Stripe.

### Epic 9: Legal, Security und DSGVO

#### SEC-001: Dokumentenschutz

Prioritaet: P0  
Ziel: Hochgeladene Verifikationsdokumente sind nicht oeffentlich erreichbar.

Akzeptanzkriterien:

- Supabase Bucket ist privat.
- Dokument-URLs werden nur serverseitig/signiert fuer Admins erzeugt.
- Member koennen nur eigene Dokumente sehen.

#### SEC-002: Datenschutz, Impressum, AGB

Prioritaet: P0  
Ziel: Rechtliche Basis fuer Launch.

Akzeptanzkriterien:

- Datenschutzseite existiert.
- Impressum existiert.
- AGB-Seite existiert.
- Cookie-Banner ist integriert, falls Tracking/Cookies genutzt werden.

#### SEC-003: Audit Logs

Prioritaet: P0  
Ziel: Kritische Admin-Aktionen sind nachvollziehbar.

Akzeptanzkriterien:

- Rang-Zuweisung wird geloggt.
- Verifikationsentscheidung wird geloggt.
- User-Sperrung wird geloggt.

## 8. Launch-Reihenfolge

### Sprint 1: Foundation

- FND-001
- FND-002
- FND-003
- AUTH-001
- AUTH-003

Ergebnis: Nutzer koennen sich registrieren, einloggen und geschuetzte Seiten nutzen.

### Sprint 2: Onboarding und Verifikation

- AUTH-002
- VER-001
- VER-002
- VER-003
- SEC-001
- SEC-003

Ergebnis: Verifikationsprozess funktioniert manuell Ende-zu-Ende.

### Sprint 3: Payments und Dashboard

- PAY-001
- PAY-002
- PAY-003
- DASH-001
- PROF-001

Ergebnis: Nutzer koennen Founder Pro kaufen und ihren kostenlosen Verifikationsstatus sehen.

### Sprint 4: Community MVP

- COM-001
- COM-002
- COM-003
- COM-004

Ergebnis: Rangbasierte Community ist nutzbar.

### Sprint 5: Events und Admin

- EVT-001
- EVT-002
- EVT-003
- ADM-001
- ADM-002

Ergebnis: Events und operative Admin-Verwaltung sind launchfaehig.

### Sprint 6: Launch Polish

- SEC-002
- PAY-004
- ADM-003
- VER-004
- Mobile QA
- Performance QA
- Testdaten entfernen

Ergebnis: MVP ist bereit fuer geschlossenen Beta-Launch.

## 9. Phase-2 Backlog

### Founder Deals

- Deals-Liste
- Deal Detailseite
- Gutscheincodes oder Partnerlinks
- Admin Deal Management

### Affiliate Programm

- Referral Link je User
- Signup Attribution
- Dashboard mit Klicks, Signups und bezahlten Conversions
- Manuelle Auszahlungsliste

### Challenges

- Challenge-Liste
- Teilnahme
- Punkte
- Leaderboard
- Gewinner-Badge

### Mentoren-System

- Mentor-Bewerbung ab Scaler+
- Mentor-Profil
- Buchungstypen
- Kalenderverfuegbarkeit
- Stripe Connect
- Reviews

### Bezahlte Events

- Ticket Checkout
- QR-Code Ticket
- Warteliste
- After-Event Recaps

## 10. Offene Produktentscheidungen

Vor Implementierung klaeren:

- Soll die erste Community als echter Chat oder als Forum/Post-System starten?
- Sollen Nutzer vor Zahlung oder nach Zahlung verifiziert werden?
- Duerfen kostenlose Aspiring User unbegrenzt in Basis-Channels posten?
- Wird Stream Chat direkt genutzt oder erst spaeter integriert?
- Welche E-Mail-Plattform wird genutzt: Resend oder SendGrid?
- Wird die bestehende App im aktuellen Repo ersetzt oder soll Founder als neues Projekt gestartet werden?

## 11. Empfohlener naechster Schritt

Als naechstes sollte das Datenbankschema fuer den MVP definiert werden:

1. Prisma Schema fuer User, Profile, Verification, Subscription, Channel, Post und Event.
2. Supabase Storage Bucket Strategie fuer Dokumente.
3. Route-Struktur fuer Public, Member und Admin.
4. Erste UI-Komponenten fuer Founder Branding.

