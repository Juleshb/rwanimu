# QA-11 — Premium Public Website & CMS
Status: SOURCE/STATIC PASS after fixes — Implementation 2.17.11

## Defects found and fixed
1. Public website was static and did not consume published CMS content. It now loads only the public API projection and retains safe fallback content if the API is unavailable.
2. Admin CMS had backend endpoints but no usable Admin UI. Added Admin content screen for draft creation, photo selection/upload-as-content, preview, publish and unpublish.
3. CMS code used `user.userId` while the authenticated identity used elsewhere is `user.sub`; corrected so ownership/audit attribution uses the logged-in user.
4. Added explicit content-type, public-price and image-source validation.
5. Update semantics could not intentionally clear body/image/public price; corrected using presence-aware updates.
6. Missing content IDs could silently return empty results; create/update/publish/preview now validate and return not-found where appropriate.
7. Added audit events for website content create/update/publish/unpublish.
8. Public products and announcements can now display uploaded photos while keeping the premium system-owned layout/animation.

## Requirement preserved
The ordinary CMS user does not design animations/layout/theme. The system owns the premium responsive design. Admin only manages approved public content such as photos, products, announcements/communications and text, then previews and publishes/unpublishes it.

## Privacy check
The public API returns only id, content type, title, body, public image, optional public price, sort order and published time. It does not expose buying price, WAC, COGS, profit, supplier data or internal stock quantities.

## Static checks
- Public API consumption: PASS
- Published-only public projection: PASS
- Admin-only CMS mutations: PASS
- Preview / Publish / Unpublish foundation: PASS
- Photo content support: PASS
- Responsive premium CSS + reduced-motion support: PASS
- Internal financial/stock fields absent from public projection: PASS
- ZIP integrity: PASS

## Runtime still pending
Real browser/mobile rendering, live API/PostgreSQL CMS workflow, image payload/storage performance, production object/media storage, HTTPS/domain/CDN and Windows/browser testing remain pending for deployment/runtime QA.
