# SGDS non-colour tokens

This page maps the non-colour design tokens of the Singapore Government Design System (SGDS) v3 onto this app's Tailwind v4 theme. Colour tokens and identity assets (masthead, crest, logos) were not read for use, in line with [ADR 0002](adr/0002-no-government-identity-marks.md).

## Sources and licences

| Repo                                   | Commit                                     | Licence                                                       | Use                                          |
| -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------- |
| `GovTechSG/sgds-web-component` v3.29.0 | `f61df918f64374c1b47e4c5a91c8a123cf3ee48d` | MIT (`LICENSE.txt`, GovTech 2026; `LICENSE`, upstream notice) | Token values copied.                         |
| `opengovsg/isomer`                     | `97329a227bf059169b860acf439296821886f325` | MIT plus extra terms (`LICENSE`)                              | Read for reference only. No value is copied. |

The Isomer licence adds Singapore-law and SIAC arbitration terms and excludes logos, crests and any asset marked restricted. Nothing taken here is an excluded asset, but because of the added terms the Isomer values were only compared, not reused. The SGDS web component repo is plain MIT, so its numeric token values are used. No file was copied, only numbers.

What was read:

- SGDS: `src/themes/root.css` (primitives), `src/themes/responsive.css` (type and layout roles per breakpoint), `src/css/utility.css` (SGDS's own Tailwind v4 `@theme`), `src/css/grid.css` (container), `src/css/reboot.css` (heading pairs), and component CSS for focus, shadows and control heights.
- Isomer: `packages/components/src/presets/next/index.ts` (screens, shadows, animation) and `typography.ts` (type scale). Isomer has no container or max-width tokens.
- Not found: a `sgds-tokens` repo or Figma export. The npm package `@govtechsg/sgds` is the v2 Bootstrap build and was not needed, since `root.css` is the v3 source of truth.

SGDS source paths below are relative to the `sgds-web-component` clone at the SHA above. The `@theme` lines are applied in `app/src/index.css` under the comment "Non-colour scale from SGDS v3". Component changes are listed at the end. The page container uses `max-w-page-xl` (1168px) with `px-5 sm:px-6 md:px-7` gutters (SGDS 20/24/28px).

## Spacing

SGDS base unit is 4px (`src/css/utility.css:7`). Tailwind's default `--spacing: 0.25rem` is the same, so no `@theme` line is needed. The SGDS scale is a subset of Tailwind steps.

| SGDS token               | SGDS value     | Our token              | Our value | SGDS source               |
| ------------------------ | -------------- | ---------------------- | --------- | ------------------------- |
| `--sgds-spacer-0`        | 0              | `p-0`, `gap-0`         | 0         | `src/themes/root.css:250` |
| `--sgds-spacer-1`        | 2px            | `*-0.5`                | 2px       | `root.css:251`            |
| `--sgds-spacer-2`        | 4px            | `*-1`                  | 4px       | `root.css:252`            |
| `--sgds-spacer-3`        | 8px            | `*-2`                  | 8px       | `root.css:253`            |
| `--sgds-spacer-4`        | 12px           | `*-3`                  | 12px      | `root.css:254`            |
| `--sgds-spacer-5`        | 16px           | `*-4`                  | 16px      | `root.css:255`            |
| `--sgds-spacer-6`        | 20px           | `*-5`                  | 20px      | `root.css:256`            |
| `--sgds-spacer-7`        | 24px           | `*-6`                  | 24px      | `root.css:257`            |
| `--sgds-spacer-8`        | 32px           | `*-8`                  | 32px      | `root.css:258`            |
| `--sgds-spacer-9`        | 48px           | `*-12`                 | 48px      | `root.css:259`            |
| `--sgds-spacer-10`       | 64px           | `*-16`                 | 64px      | `root.css:260`            |
| `--sgds-spacer-11`       | 96px           | `*-24`                 | 96px      | `root.css:261`            |
| `--sgds-spacer-12`       | 128px          | `*-32`                 | 128px     | `root.css:262`            |
| `--sgds-gutter-sm/md/lg` | 16 / 24 / 32px | `px-4`, `px-6`, `px-8` | same      | `root.css:358-360`        |

Rule for components: use only the steps in the "Our token" column. Steps such as 1.5, 2.5, 3.5, 9, 10, 11 and 14 are not SGDS spacers. Step 7 (28px) is allowed only as the `md` page gutter (`md:px-7`).

Role aliases (`--sgds-padding-*`, `--sgds-gap-*`, `--sgds-layout-*`, `--sgds-component-*`) only point at these same steps (`root.css:329-375`, `responsive.css`). Layout and component padding grow with the viewport (for example component padding xs is 16px on mobile, 20px at 768px, 24px at 1440px). We use the fixed steps.

## Type

SGDS sizes are in `src/themes/root.css:173-189`. Roles pick a size per breakpoint (`src/themes/responsive.css`, switching at 1024px). Pairs below are from `src/css/reboot.css:89-120` and component CSS. Responsive roles are applied with breakpoint prefixes, see the next table.

| SGDS token                                   | SGDS value          | Our token                             | Our value          | SGDS source                                        |
| -------------------------------------------- | ------------------- | ------------------------------------- | ------------------ | -------------------------------------------------- |
| `font-size-12` / label-xs, line 16           | 12px / 16px         | `--text-xs`, `--text-xs--line-height` | 0.75rem / 1rem     | `root.css:173`, `responsive.css`                   |
| `font-size-14` / label-sm, line 20           | 14px / 20px         | `--text-sm`                           | 0.875rem / 1.25rem | `root.css:174`, `components/Toast/toast.css:56-58` |
| `font-size-16` / body-md, line 24            | 16px / 24px         | `--text-base`                         | 1rem / 1.5rem      | `root.css:175`, `css/reboot.css:12-14`             |
| `font-size-18` / subtitle-md, line 24        | 18px / 24px         | `--text-lg`                           | 1.125rem / 1.5rem  | `root.css:176`, `css/reboot.css:113-114`           |
| `font-size-20` / body-lg at 1024, line 28    | 20px / 28px         | `--text-xl`                           | 1.25rem / 1.75rem  | `root.css:177`, `responsive.css`                   |
| `font-size-24` / heading-md mobile           | 24px / 32px at 1024 | `--text-2xl`                          | 1.5rem / 2rem      | `root.css:179`, `css/reboot.css:101-102`           |
| `font-size-30` / heading-lg at 1024, line 36 | 30px / 36px         | `--text-3xl`                          | 1.875rem / 2.25rem | `root.css:182`, `css/reboot.css:95-96`             |
| `font-size-36` / heading-xl at 1024, line 44 | 36px / 44px         | `--text-4xl`                          | 2.25rem / 2.75rem  | `root.css:184`, `css/reboot.css:89-90`             |
| `font-size-48`                               | 48px                | `--text-5xl`                          | 3rem / 3.25rem     | `root.css:187`                                     |
| `font-weight-light`                          | 300                 | `font-light`                          | 300                | `root.css:167`                                     |
| `font-weight-regular`                        | 400                 | `font-normal`                         | 400                | `root.css:168`                                     |
| `font-weight-semibold`                       | 600                 | `font-semibold`                       | 600                | `root.css:169`                                     |
| `font-weight-bold`                           | 700                 | `font-bold`                           | 700                | `root.css:170`                                     |
| `letter-spacing-tighter`                     | -1px                | `--tracking-tighter`                  | -1px               | `root.css:201`                                     |
| `letter-spacing-tight`                       | -0.4px              | `--tracking-tight`                    | -0.4px             | `root.css:202`                                     |
| `letter-spacing-normal`                      | 0                   | `--tracking-normal`                   | 0                  | `root.css:203`                                     |
| `letter-spacing-wide`                        | 1px                 | `--tracking-wide`                     | 1px                | `root.css:204`                                     |
| `letter-spacing-wider`                       | 2px                 | `--tracking-wider`                    | 2px                | `root.css:205`                                     |

### Responsive roles

Each role has a mobile size, a 1024px size and a 1440px size. We use the nearest Tailwind step in our `@theme` and switch at `lg:` (1024px, same as SGDS). Line heights come from the matching `reboot.css` pair, so heading-lg uses `line-height-lg` and so on. Our classes carry their own line heights from `index.css`, which match or sit within 4px of SGDS.

| SGDS role                                       | Mobile px / line | 1024px px / line | 1440px px / line | Our classes                     | SGDS source                                                                                                          |
| ----------------------------------------------- | ---------------- | ---------------- | ---------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| heading-lg (page title, h1)                     | 28 / 32          | 30 / 36          | 32 / 40          | `text-2xl lg:text-3xl` (24, 30) | `responsive.css:10`, `108`, `207`; lines `46-54`, `144-152`, `243-251`; `reboot.css:94-98`; sizes `root.css:177-183` |
| heading-md (section, h2)                        | 24 / 28          | 26 / 32          | 28 / 32          | `text-xl lg:text-2xl` (20, 24)  | `responsive.css:9`, `107`, `206`; `reboot.css:100-104`                                                               |
| heading-sm (group, h3)                          | 20 / 24          | 22 / 28          | 24 / 28          | `text-lg lg:text-xl` (18, 20)   | `responsive.css:8`, `106`, `205`; `reboot.css:106-110`                                                               |
| subtitle-md (card, dialog, sheet, alert titles) | 18 / 24          | 20 / 24          | 20 / 24          | `text-base lg:text-lg` (16, 18) | `responsive.css:15`, `113`, `212`; `reboot.css:112-116`                                                              |
| body-md                                         | 16 / 24          | 16 / 24          | 16 / 24          | `text-base`                     | `responsive.css:19`, `117`, `216`                                                                                    |

The mobile mapping takes the Tailwind step at or below the SGDS value, so our mobile sizes run up to 4px under SGDS. The 1440px step is not taken: 32 and 28 have no exact token in our scale (text-3xl is 30, text-2xl is 24), and heading-sm stays with them so there is one breakpoint, so desktop stays at the 1024px values. The home route h1 is a page title. Display (32 to 56), subtitle-sm, body-lg and the label roles are not used by any heading here. The `font-serif` family stays on all of them. Long titles use `break-words` so a single long word wraps at 320px.

Other sizes SGDS defines (22, 26, 28, 32, 40, 44, 52, 56) have no Tailwind default name. They appear only in responsive heading and display roles and are listed under "Not adopted". Line heights are pixel values 16 to 64 (`root.css:208-220`), which match `leading-4` through `leading-16`.

## Radius

| SGDS token                             | SGDS value | Our token      | Our value        | SGDS source               |
| -------------------------------------- | ---------- | -------------- | ---------------- | ------------------------- |
| `border-radius-none`                   | 0          | `rounded-none` | 0                | `root.css:112`            |
| `border-radius-xs`                     | 2px        | `--radius-xs`  | 2px              | `root.css:113`            |
| `border-radius-sm` (indicator)         | 4px        | `--radius-sm`  | 4px              | `root.css:114`, `129`     |
| `border-radius-md` (interactive, form) | 8px        | `--radius-md`  | 8px              | `root.css:115`, `130-132` |
| `border-radius-lg` (surface, overlay)  | 12px       | `--radius-lg`  | 12px             | `root.css:116`, `133-134` |
| `border-radius-xl`                     | 16px       | `--radius-xl`  | 16px             | `root.css:117`            |
| `border-radius-2-xl`                   | 24px       | `--radius-2xl` | 24px             | `root.css:118`            |
| `border-radius-3-xl`                   | 32px       | `--radius-3xl` | 32px             | `root.css:119`            |
| `border-radius-full`                   | 999px      | `rounded-full` | Tailwind default | `root.css:120`            |
| `structure-border-radius`              | 0          | not used       |                  | `root.css:128`            |

Today index.css derives radius from `--radius: 0.625rem` (sm 6px, md 8px, lg 10px, xl 14px). The patch replaces those four lines with the fixed SGDS values.

## Borders

| SGDS token                      | SGDS value | Our token      | Our value | SGDS source           |
| ------------------------------- | ---------- | -------------- | --------- | --------------------- |
| `border-width-0`                | 0          | `border-0`     | 0         | `root.css:103`        |
| `border-width-1` (form default) | 1px        | `border`       | 1px       | `root.css:104`, `108` |
| `border-width-2` (form thick)   | 2px        | `border-2`     | 2px       | `root.css:105`, `109` |
| `border-width-3`                | 3px        | `border-[3px]` | not used  | `root.css:106`        |
| `border-width-4`                | 4px        | `border-4`     | 4px       | `root.css:107`        |

Tailwind defaults already match. No `@theme` line is needed.

## Breakpoints

| SGDS token                      | SGDS value | Our token          | Our value | SGDS source                          |
| ------------------------------- | ---------- | ------------------ | --------- | ------------------------------------ |
| `breakpoint-xs`                 | 320px      | `--breakpoint-xs`  | 20rem     | `root.css:137`, `css/utility.css:10` |
| `breakpoint-sm`                 | 512px      | `--breakpoint-sm`  | 32rem     | `root.css:138`, `utility.css:11`     |
| `breakpoint-md`                 | 768px      | `--breakpoint-md`  | 48rem     | `root.css:139`, `utility.css:12`     |
| `breakpoint-lg`                 | 1024px     | `--breakpoint-lg`  | 64rem     | `root.css:140`, `utility.css:13`     |
| `breakpoint-xl`                 | 1280px     | `--breakpoint-xl`  | 80rem     | `root.css:141`, `utility.css:14`     |
| `breakpoint-2-xl`               | 1440px     | `--breakpoint-2xl` | 90rem     | `root.css:142`, `utility.css:15`     |
| `breakpoint-sbar-3-xl` / `3-xl` | 1680px     | `--breakpoint-3xl` | 105rem    | `root.css:149`, `utility.css:16`     |

Two defaults move: `sm` from 640px to 512px and `2xl` from 1536px to 1440px. The app uses `sm:` 25 times and `md:` 5 times in files this task owns, so the patch shifts those switch points.

## Containers

| SGDS token                        | SGDS value               | Our token                | Our value              | SGDS source                        |
| --------------------------------- | ------------------------ | ------------------------ | ---------------------- | ---------------------------------- |
| `text-max-width`                  | 864px                    | `--container-text`       | 54rem                  | `root.css:381`                     |
| `container-max-width-md`          | 768px                    | `--container-page-md`    | 48rem                  | `root.css:384`                     |
| `container-max-width-lg`          | 888px                    | `--container-page-lg`    | 55.5rem                | `root.css:385`, `css/grid.css:159` |
| `container-max-width-xl`          | 1168px                   | `--container-page-xl`    | 73rem                  | `root.css:386`, `grid.css:224`     |
| `container-max-width-2-xl`        | 1312px                   | `--container-page-2xl`   | 82rem                  | `root.css:387`, `grid.css:292`     |
| `container-max-width-3-xl`        | 1440px                   | `--container-page-3xl`   | 90rem                  | `root.css:388`                     |
| page gutter below 512 / 512 / 768 | 20 / 24 / 28px each side | `px-5` / `px-6` / `px-7` | not matched, see below | `css/grid.css:5`, `52`, `99`       |

New names only. The default `--container-*` sizes (`max-w-sm`, `max-w-lg` and so on) stay, because dialogs and popovers use them as component widths. SGDS modal widths are 480, 640, 800 and 1280px (`components/Modal/modal.css:4-18`).

The page wrapper in `__root.tsx`, `SiteHeader.tsx` and `SiteFooter.tsx` uses `max-w-page-xl` (1168px).

## Focus

| SGDS token             | SGDS value                             | Our token          | Our value          | SGDS source    |
| ---------------------- | -------------------------------------- | ------------------ | ------------------ | -------------- |
| `outline-focus`        | 2px solid (colour is a blue primitive) | `ring-2 ring-ring` | 2px solid `--ring` | `root.css:377` |
| `outline-offset-focus` | -2px (inset)                           | `ring-offset-2`    | 2px outside        | `root.css:378` |

Width matches. Offset and colour differ on purpose, see below.

## Shadows

SGDS has no shadow tokens. Its components repeat four literals.

| SGDS literal   | SGDS value                     | Our token     | Our value                        | SGDS source                               |
| -------------- | ------------------------------ | ------------- | -------------------------------- | ----------------------------------------- |
| Nav bar        | `0 2px 4px rgba(14,14,14,.08)` | `--shadow-sm` | `0 2px 4px` at 8% of `--overlay` | `components/Mainnav/mainnav.css:8`        |
| Dropdown       | `0 0 1px .12, 0 4px 8px .12`   | `--shadow-md` | same geometry, 12%               | `components/Dropdown/dropdown-menu.css:9` |
| Card hover     | `0 0 1px .12, 0 8px 16px .12`  | `--shadow-lg` | same geometry, 12%               | `base/card.css:9`                         |
| Toast, tooltip | `0 0 2px .12, 0 8px 16px .14`  | `--shadow-xl` | same geometry, 12% and 14%       | `components/Toast/toast.css:30`           |

Colour comes from `color-mix(in srgb, var(--overlay) N%, transparent)`. `--overlay` is `#161512`, close to the SGDS near-black `#0e0e0e`. This registers a shadow, not a colour utility.

## Motion

| SGDS token                 | SGDS value                        | Our token                       | Our value      | SGDS source           |
| -------------------------- | --------------------------------- | ------------------------------- | -------------- | --------------------- |
| `motion-duration-faster`   | 100ms                             | `duration-100`                  | 100ms          | `root.css:401`        |
| `motion-duration-fast`     | 200ms                             | `duration-200`                  | 200ms (drawer) | `root.css:402`        |
| `motion-duration-standard` | 300ms                             | `duration-300`                  | 300ms (expand) | `root.css:403`        |
| `motion-duration-slow`     | 400ms                             | `duration-400`                  | 400ms          | `root.css:404`        |
| `motion-duration-slower`   | 500ms                             | `duration-500`                  | 500ms          | `root.css:405`        |
| literal hover              | 0.15s ease-in-out                 | `--default-transition-duration` | 150ms          | `base/button.css:161` |
| `motion-easing-enter`      | `cubic-bezier(0.1, 0, 0.5, 0)`    | `--ease-enter`                  | same           | `root.css:396`        |
| `motion-easing-exit`       | `cubic-bezier(0.15, 0.6, 0.6, 1)` | `--ease-exit`                   | same           | `root.css:397`        |
| `motion-easing-standard`   | `cubic-bezier(0.25, 0, 0.25, 1)`  | `--ease-standard`               | same           | `root.css:398`        |

Tailwind v4 has no named duration namespace, so durations use the numeric `duration-*` utilities. The STYLE.md table (150, 300, 200ms) already lands on SGDS values. Z-index is covered under "Not adopted".

## Where we deliberately differ

- **Serif headings.** Page and section headings use `font-serif` (Source Serif 4). SGDS v3 headings are sans (`root.css:152-162`; v2 used Lato, v3 uses Inter). We keep the serif for the reading product and use the SGDS sizes and line heights under it.
- **Body font.** SGDS v3 already uses Inter (`root.css:152`), so there is no difference. `--font-sans` stays as is. Royce kept Inter after the 14 Oct 2026 AI-look review because SGDS v3 sets `--sgds-font-family-brand` to Inter.
- **Medium weight.** SGDS has 300, 400, 600 and 700 only. We keep `font-medium` (500) for menu items, buttons and labels because Inter is variable and the extra step helps small text.
- **Responsive type, no 1440px step.** Responsive roles are applied with breakpoint prefixes (`text-2xl lg:text-3xl`). SGDS adds a third step at 1440px (32, 28 and 24px for heading-lg, md and sm); 32 and 28 have no matching token, so we stop at the 1024px values for all three.
- **Page title one role down.** SGDS reboot maps `h1` to heading-xl (32/36/40px, `reboot.css:88-92`). Our page title uses heading-lg (28/30), one level down, because a serif h1 at 30px already reads large in a dense research tool.
- **Focus ring.** SGDS draws a 2px inset outline in a blue primitive. We keep `outline-hidden` plus a 2px `ring-ring` with a 2px offset in `--ring`, so the colour stays a semantic token and passes the contrast check against both themes.
- **Control heights.** shadcn's 32/36/40 px stay. This is a research tool where people scan dense tables, and both scales clear WCAG 2.5.8 (decision 28). SGDS buttons are 32, 40, 48, 56px (`base/button.css:156` for the 48px default, `styles/form-text-control.css:37` for inputs at 48px). 36px (`h-9`) is not an SGDS step.
- **Radius for cards.** SGDS surfaces use 12px, so `Card` moved to `rounded-lg`. `rounded-sm` stays on menu items, which is the SGDS indicator radius (4px).
- **Badge radius.** `Badge` uses `rounded-sm` (4px), the SGDS indicator radius, in every variant, not shadcn's `rounded-full` pill. Royce accepted this in the 14 Oct 2026 AI-look review (proposal T6), so it overrides the shadcn default.
- **Card shadow.** `Card` keeps its `border-separator` hairline and drops shadcn's `shadow-sm`. Royce accepted this in the same review (proposal T5), so it overrides the shadcn default.
- **Radius var.** `--radius` was removed from `:root` when the patch landed; the toast radius reads `--radius-md`.
- **Shadow colour.** SGDS uses literal `rgba(14,14,14,...)`. We use `--overlay` so no raw colour appears.
- **Breakpoint names.** We keep Tailwind's names (`sm`, `md`, ...) with SGDS values. SGDS also names `xs` and `3xl`, which we add.
- **Container names.** `page-*` names instead of `sgds-*` so no identity word leaks into class names.
- **Page gutters (resolved).** SGDS uses 20px below 512px, 24px from 512px and 28px from 768px (`css/grid.css:5`, `52`, `99`). The app now uses `px-5 sm:px-6 md:px-7` in `__root.tsx`, `SiteHeader.tsx` and `SiteFooter.tsx` (decision 25).
- **Switch and checkbox internals.** `h-[1.15rem]` on the switch and `size-3.5` icons are control internals, not layout spacing. SGDS icon sizes are 12, 16, 20, 24px (`root.css:192-198`). Left as is.

## Not adopted

- Responsive role tokens (`--sgds-layout-*`, `--sgds-component-*`, `--sgds-text-gap-*`). They alias spacer steps and change per breakpoint. We pick the fixed step in the component.
- Font sizes 22, 26, 28, 32, 40, 44, 52, 56 and the display, subtitle, list, caption, overline and link roles.
- Opacity scale 0 to 100 (`root.css:223-235`). STYLE.md bans opacity tints.
- Paragraph and list spacing (`root.css:238-247`).
- Icon size tokens (`root.css:192-198`).
- Dimension scale (`root.css:265-326`). Used for fixed widths and heights inside SGDS components.
- Z-index scale 0, 100, 200, 400, 800, 1600 (`root.css:408-421`). Tailwind v4 has no z-index theme namespace and the Radix portals here rely on `z-50`.
- Main-nav sizes (`root.css:391-393`) and sidebar breakpoints (`root.css:145-149`).
- Border width 3px, form border-radius aliases, `structure-border-radius`.
- Isomer extras: `xs` 576px and `xl` 1240px screens, and its `button-pulse` and `slide-up-fade-in` animations (`presets/next/index.ts:88-112`). They differ from SGDS and were not used.

## Component changes already made

All are Tailwind classes that exist with or without the `@theme` lines, which are now applied.

| File                                                                                                              | Before                                 | After                                                                 |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| `ui/tooltip.tsx`, `ui/select.tsx` (2), `ui/dropdown-menu.tsx` (5)                                                 | `py-1.5`                               | `py-2`                                                                |
| `ui/sheet.tsx`, `ui/alert-dialog.tsx`, `ui/tabs.tsx`, `ui/calendar.tsx`, `ui/breadcrumb.tsx` (2), `ui/button.tsx` | `gap-1.5`                              | `gap-2`                                                               |
| `ui/breadcrumb.tsx`                                                                                               | `sm:gap-2.5`                           | `sm:gap-3`                                                            |
| `ui/button.tsx` (size sm)                                                                                         | `has-[>svg]:px-2.5`                    | `has-[>svg]:px-2`                                                     |
| `ui/pagination.tsx`                                                                                               | `px-2.5 sm:pl-2.5`, `px-2.5 sm:pr-2.5` | `px-3 sm:pl-3`, `px-3 sm:pr-3`                                        |
| `ui/tabs.tsx`                                                                                                     | `p-[3px]`                              | `p-1`                                                                 |
| `ui/calendar.tsx` (2)                                                                                             | `text-[0.8rem]`                        | `text-xs`                                                             |
| `ui/alert.tsx`                                                                                                    | `[&_p]:leading-relaxed`                | `[&_p]:leading-5`                                                     |
| `ui/dropdown-menu.tsx`                                                                                            | `tracking-widest`                      | `tracking-wide`                                                       |
| `ui/card.tsx`                                                                                                     | `rounded-xl`                           | `rounded-lg`                                                          |
| `ui/card.tsx`                                                                                                     | `shadow-sm`                            | no shadow (T5)                                                        |
| `ui/badge.tsx`                                                                                                    | `rounded-full`                         | `rounded-sm` (T6)                                                     |
| `layout/SiteFooter.tsx`                                                                                           | `py-10`                                | `py-12`                                                               |
| `layout/NoticeEmpty.tsx`, `layout/NoticeError.tsx`                                                                | `max-w-[420px]`                        | `max-w-100`                                                           |
| `design/tableSittingSpeeches/useTableColumnsSittingSpeeches.tsx`                                                  | `max-w-[300px]`, `shadow-2xl`          | `max-w-80`, `shadow-lg`                                               |
| `design/SectionForms.tsx`                                                                                         | icon `left-3`, input `pl-9`            | icon `left-2`, input `pl-8`                                           |
| `layout/PageHeader.tsx`, `design/Section.tsx`                                                                     | `text-3xl`, `text-2xl`                 | `text-2xl lg:text-3xl break-words`, `text-xl lg:text-2xl break-words` |
| `ui/card.tsx`, `ui/dialog.tsx`, `ui/alert-dialog.tsx`, `ui/sheet.tsx`, `ui/alert.tsx` (titles)                    | none or `text-lg`                      | `text-base lg:text-lg break-words`                                    |
| `layout/PageHeader.tsx`, `layout/NoticeError.tsx`                                                                 | actions and buttons did not wrap       | `flex-wrap` added                                                     |
| `design/SectionForms.tsx` (2)                                                                                     | `w-80`                                 | `w-80 max-w-full`, so 320px does not overflow                         |
