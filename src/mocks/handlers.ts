import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8080'

export const handlers = [

  // ── Auth ──────────────────────────────────────────────────────
//   http.post(`${BASE}/api/v1/auth/login`, async ({ request }) => {
//   const { email, password } = await request.json() as { email: string; password: string }

//   // Validate credentials
//   if (email !== 'nattawut@agency.com' || password !== 'pinnlo2026') {
//     return HttpResponse.json(
//       { message: 'Invalid email or password' },
//       { status: 401 }
//     )
//   }

//   await new Promise((r) => setTimeout(r, 600))

//   return HttpResponse.json({
//     token: `mock-jwt-token-${Date.now()}`,
//     user: {
//       id:         'user-001',
//       email:      'nattawut@agency.com',
//       name:       'Nattawut Chaimongkol',
//       role:       'OWNER',
//       agencyId:   'agency-001',
//       agencyName: 'NC Digital Agency',
//       plan:       'AGENCY',
//       locale:     'en',
//     },
//   })
// }),

//   http.post(`${BASE}/api/v1/auth/signup`, () => {
//     return HttpResponse.json({ message: 'Signup successful' }, { status: 201 })
//   }),

//   http.post(`${BASE}/api/v1/auth/refresh`, () => {
//     return HttpResponse.json({ accessToken: 'mock-refreshed-token-xyz' })
//   }),

  // ── Dashboard ─────────────────────────────────────────────────
  http.get(`${BASE}/api/dashboard/stats`, () => {
    return HttpResponse.json({
      totalClients:   12,
      scheduledPosts: 8,
      newLeads:       24,
      unreadComments: 5,
    })
  }),

  // // ── Clients ───────────────────────────────────────────────────
  // http.get(`${BASE}/api/clients`, () => {
  //   return HttpResponse.json({
  //     content: [
  //       { id: 'client-001', name: 'Somjai Coffee', platforms: ['FACEBOOK', 'INSTAGRAM'], status: 'ACTIVE' },
  //       { id: 'client-002', name: 'BKK Fitness',   platforms: ['FACEBOOK', 'LINE'],      status: 'ACTIVE' },
  //       { id: 'client-003', name: 'Mango Resort',  platforms: ['FACEBOOK', 'INSTAGRAM', 'WHATSAPP'], status: 'ACTIVE' },
  //     ],
  //     totalElements: 3,
  //     totalPages:    1,
  //     page:          0,
  //     size:          20,
  //   })
  // }),

 // ── Posts ─────────────────────────────────────────────────────
  http.get(`${BASE}/api/posts`, ({ request }) => {
    const url    = new URL(request.url)
    const status = url.searchParams.get('status')

    const allPosts = [
      {
        id:          'post-001',
        content:     'Special promotion! 20% off all new menu items 🎉 Come and try them today!',
        status:      'SCHEDULED',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        publishedAt: null,
        platforms:   ['FACEBOOK', 'INSTAGRAM'],
        targets:     [
          { platform: 'FACEBOOK',  status: 'SCHEDULED' },
          { platform: 'INSTAGRAM', status: 'SCHEDULED' },
        ],
        approval:    null,
        media:       [],
        labels:      ['promotion', 'food'],
        clientId:    'client-001',
        clientName:  'Somjai Coffee',
        createdBy:   'Nattawut C.',
        createdAt:   new Date(Date.now() - 7200000).toISOString(),
        updatedAt:   new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id:          'post-002',
        content:     'New workout program starting Monday. Limited slots available! Sign up now 💪',
        status:      'PUBLISHED',
        scheduledAt: new Date(Date.now() - 86400000).toISOString(),
        publishedAt: new Date(Date.now() - 82800000).toISOString(),
        platforms:   ['FACEBOOK'],
        targets:     [{ platform: 'FACEBOOK', status: 'PUBLISHED' }],
        approval:    { id: 'apr-001', status: 'APPROVED', approvedBy: 'Nattawut C.', decidedAt: new Date(Date.now() - 90000000).toISOString() },
        media:       [],
        labels:      ['fitness'],
        clientId:    'client-002',
        clientName:  'BKK Fitness',
        createdBy:   'Pim S.',
        createdAt:   new Date(Date.now() - 172800000).toISOString(),
        updatedAt:   new Date(Date.now() - 82800000).toISOString(),
      },
      {
        id:          'post-003',
        content:     'Welcome to travel season! Relax at special prices ✈️🌴 Book now for exclusive discounts',
        status:      'DRAFT',
        scheduledAt: null,
        publishedAt: null,
        platforms:   ['FACEBOOK', 'INSTAGRAM', 'LINE'],
        targets:     [
          { platform: 'FACEBOOK',  status: 'DRAFT' },
          { platform: 'INSTAGRAM', status: 'DRAFT' },
          { platform: 'LINE',      status: 'DRAFT' },
        ],
        approval:    null,
        media:       [],
        labels:      ['travel', 'promotion'],
        clientId:    'client-003',
        clientName:  'Mango Resort',
        createdBy:   'Nattawut C.',
        createdAt:   new Date(Date.now() - 3600000).toISOString(),
        updatedAt:   new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id:          'post-004',
        content:     'Grand opening of our second branch in Thonglor! Come visit us this weekend 🎊',
        status:      'PENDING_REVIEW',
        scheduledAt: new Date(Date.now() + 172800000).toISOString(),
        publishedAt: null,
        platforms:   ['FACEBOOK', 'INSTAGRAM'],
        targets:     [
          { platform: 'FACEBOOK',  status: 'PENDING_REVIEW' },
          { platform: 'INSTAGRAM', status: 'PENDING_REVIEW' },
        ],
        approval:    { id: 'apr-002', status: 'PENDING' },
        media:       [],
        labels:      ['announcement'],
        clientId:    'client-001',
        clientName:  'Somjai Coffee',
        createdBy:   'Pim S.',
        createdAt:   new Date(Date.now() - 1800000).toISOString(),
        updatedAt:   new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id:          'post-005',
        content:     'Flash sale! 50% off all memberships today only ⚡',
        status:      'FAILED',
        scheduledAt: new Date(Date.now() - 3600000).toISOString(),
        publishedAt: null,
        platforms:   ['FACEBOOK'],
        targets:     [{ platform: 'FACEBOOK', status: 'FAILED', errorMsg: 'Image format not supported' }],
        approval:    null,
        media:       [],
        labels:      ['sale'],
        clientId:    'client-002',
        clientName:  'BKK Fitness',
        createdBy:   'Pim S.',
        createdAt:   new Date(Date.now() - 7200000).toISOString(),
        updatedAt:   new Date(Date.now() - 3600000).toISOString(),
      },
    ]

    const filtered = status
      ? allPosts.filter((p) => p.status === status)
      : allPosts

    return HttpResponse.json({
      content:       filtered,
      totalElements: filtered.length,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.get(`${BASE}/api/posts/:id`, ({ params }) => {
    return HttpResponse.json({
      id:          params.id,
      content:     'Post content here',
      status:      'DRAFT',
      scheduledAt: null,
      publishedAt: null,
      platforms:   ['FACEBOOK'],
      targets:     [{ platform: 'FACEBOOK', status: 'DRAFT' }],
      approval:    null,
      media:       [],
      labels:      [],
      clientId:    'client-001',
      clientName:  'Somjai Coffee',
      createdBy:   'Nattawut C.',
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    })
  }),

  http.post(`${BASE}/api/posts`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id:          `post-${Date.now()}`,
      ...body,
      status:      'SCHEDULED',
      publishedAt: null,
      targets:     [],
      approval:    null,
      media:       [],
      createdBy:   'Nattawut C.',
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    }, { status: 201 })
  }),

  http.patch(`${BASE}/api/posts/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ id: params.id, ...body, updatedAt: new Date().toISOString() })
  }),

  http.delete(`${BASE}/api/posts/:id`, () => {
    return HttpResponse.json({ message: 'Post deleted' })
  }),

  http.post(`${BASE}/api/posts/:id/approve`, () => {
    return HttpResponse.json({ id: 'apr-new', status: 'APPROVED', decidedAt: new Date().toISOString() })
  }),

  http.post(`${BASE}/api/posts/:id/reject`, async ({ request }) => {
    const body = await request.json() as { comment: string }
    return HttpResponse.json({ id: 'apr-new', status: 'REJECTED', comment: body.comment, decidedAt: new Date().toISOString() })
  }),
  http.put(`${BASE}/api/posts/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  }),
  // ── Media upload ───────────────────────────────────────────────
  http.post(`${BASE}/api/media/upload`, async () => {
    // Simulate upload delay
    await new Promise((r) => setTimeout(r, 1200))
    return HttpResponse.json({
      id:        `media-${Date.now()}`,
      url:       'https://placehold.co/800x600/1D9E75/white?text=Uploaded+Image',
      mimeType:  'image/jpeg',
      sizeBytes: 204800,
    }, { status: 201 })
  }),
  // ── Calendar ──────────────────────────────────────────────────
  http.get(`${BASE}/api/posts/calendar`, ({ request }) => {
    const url   = new URL(request.url)
    const year  = parseInt(url.searchParams.get('year')  ?? String(new Date().getFullYear()))
    const month = parseInt(url.searchParams.get('month') ?? String(new Date().getMonth() + 1))

    const days: Record<string, { id: string; status: string; clientName: string }[]> = {}

    // Scatter mock posts across the current month
    const pad = (n: number) => String(n).padStart(2, '0')
    const base = `${year}-${pad(month)}`

    days[`${base}-03`] = [{ id: 'post-001', status: 'PUBLISHED', clientName: 'Somjai Coffee' }]
    days[`${base}-05`] = [{ id: 'post-002', status: 'PUBLISHED', clientName: 'BKK Fitness' }]
    days[`${base}-08`] = [
      { id: 'post-003', status: 'SCHEDULED',  clientName: 'Mango Resort' },
      { id: 'post-004', status: 'SCHEDULED',  clientName: 'Somjai Coffee' },
    ]
    days[`${base}-12`] = [{ id: 'post-005', status: 'FAILED',    clientName: 'BKK Fitness' }]
    days[`${base}-15`] = [{ id: 'post-006', status: 'SCHEDULED', clientName: 'Somjai Coffee' }]
    days[`${base}-18`] = [{ id: 'post-007', status: 'DRAFT',     clientName: 'Mango Resort' }]
    days[`${base}-22`] = [
      { id: 'post-008', status: 'SCHEDULED', clientName: 'BKK Fitness' },
      { id: 'post-009', status: 'SCHEDULED', clientName: 'Mango Resort' },
      { id: 'post-010', status: 'DRAFT',     clientName: 'Somjai Coffee' },
    ]
    days[`${base}-25`] = [{ id: 'post-011', status: 'PENDING_REVIEW', clientName: 'Somjai Coffee' }]
    days[`${base}-28`] = [{ id: 'post-012', status: 'SCHEDULED', clientName: 'BKK Fitness' }]

    return HttpResponse.json({ year, month, days })
  }),

  // // ── CRM contacts ──────────────────────────────────────────────
  // http.get(`${BASE}/api/contacts`, ({ request }) => {
  //   const url    = new URL(request.url)
  //   const search = url.searchParams.get('search')?.toLowerCase() ?? ''
  //   const tag    = url.searchParams.get('tag') ?? ''

  //   const allContacts = [
  //     {
  //       id:           'contact-001',
  //       name:         'Sirinda Rattanapruk',
  //       phone:        '+66812345678',
  //       email:        'sirinda@email.com',
  //       fbPsid:       'psid-001',
  //       waId:         null,
  //       lineUid:      null,
  //       source:       'MESSENGER',
  //       tags:         ['vip', 'interested'],
  //       assignedTo:   'Pim S.',
  //       clientId:     'client-001',
  //       clientName:   'Somjai Coffee',
  //       notes:        'Interested in catering packages for corporate events.',
  //       lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
  //       createdAt:    new Date(Date.now() - 86400000 * 3).toISOString(),
  //       activities:   [
  //         {
  //           id: 'act-001',
  //           type: 'MESSENGER_MESSAGE',
  //           content: 'Hello, I would like to know more about your catering service.',
  //           createdBy: 'Sirinda Rattanapruk',
  //           createdAt: new Date(Date.now() - 3600000).toISOString(),
  //         },
  //         {
  //           id: 'act-002',
  //           type: 'TAG_ADDED',
  //           content: 'Tag "vip" added',
  //           createdBy: 'Pim S.',
  //           createdAt: new Date(Date.now() - 7200000).toISOString(),
  //         },
  //         {
  //           id: 'act-003',
  //           type: 'NOTE',
  //           content: 'Interested in catering packages for corporate events.',
  //           createdBy: 'Pim S.',
  //           createdAt: new Date(Date.now() - 86400000).toISOString(),
  //         },
  //         {
  //           id: 'act-004',
  //           type: 'MESSENGER_MESSAGE',
  //           content: 'Do you offer weekend catering?',
  //           createdBy: 'Sirinda Rattanapruk',
  //           createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  //         },
  //         {
  //           id: 'act-005',
  //           type: 'ASSIGNED',
  //           content: 'Assigned to Pim S.',
  //           createdBy: 'Nattawut C.',
  //           createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  //         },
  //       ],
  //     },
  //     {
  //       id:           'contact-002',
  //       name:         'Krit Phongsathorn',
  //       phone:        '+66898765432',
  //       email:        null,
  //       fbPsid:       null,
  //       waId:         '66898765432',
  //       lineUid:      null,
  //       source:       'WHATSAPP',
  //       tags:         ['new', 'follow-up'],
  //       assignedTo:   null,
  //       clientId:     'client-002',
  //       clientName:   'BKK Fitness',
  //       notes:        null,
  //       lastActiveAt: new Date(Date.now() - 1800000).toISOString(),
  //       createdAt:    new Date(Date.now() - 1800000).toISOString(),
  //       activities:   [
  //         {
  //           id: 'act-006',
  //           type: 'WHATSAPP_MESSAGE',
  //           content: 'Hi, what are your membership prices?',
  //           createdBy: 'Krit Phongsathorn',
  //           createdAt: new Date(Date.now() - 1800000).toISOString(),
  //         },
  //       ],
  //     },
  //     {
  //       id:           'contact-003',
  //       name:         'Mallika Suwannarat',
  //       phone:        '+66845678901',
  //       email:        'mallika@corp.co.th',
  //       fbPsid:       'psid-003',
  //       waId:         null,
  //       lineUid:      'line-uid-003',
  //       source:       'LINE',
  //       tags:         ['vip', 'corporate'],
  //       assignedTo:   'Nattawut C.',
  //       clientId:     'client-003',
  //       clientName:   'Mango Resort',
  //       notes:        'Books 10+ rooms every quarter for corporate retreats.',
  //       lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
  //       createdAt:    new Date(Date.now() - 86400000 * 14).toISOString(),
  //       activities:   [
  //         {
  //           id: 'act-007',
  //           type: 'LINE_MESSAGE',
  //           content: 'We need to book 15 rooms for the March retreat.',
  //           createdBy: 'Mallika Suwannarat',
  //           createdAt: new Date(Date.now() - 86400000).toISOString(),
  //         },
  //         {
  //           id: 'act-008',
  //           type: 'NOTE',
  //           content: 'Books 10+ rooms every quarter for corporate retreats.',
  //           createdBy: 'Nattawut C.',
  //           createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  //         },
  //       ],
  //     },
  //     {
  //       id:           'contact-004',
  //       name:         'Thanakorn Wichitkraisorn',
  //       phone:        '+66823456789',
  //       email:        null,
  //       fbPsid:       'psid-004',
  //       waId:         null,
  //       lineUid:      null,
  //       source:       'MESSENGER',
  //       tags:         ['interested'],
  //       assignedTo:   'Pim S.',
  //       clientId:     'client-001',
  //       clientName:   'Somjai Coffee',
  //       notes:        null,
  //       lastActiveAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  //       createdAt:    new Date(Date.now() - 86400000 * 5).toISOString(),
  //       activities:   [
  //         {
  //           id: 'act-009',
  //           type: 'MESSENGER_MESSAGE',
  //           content: 'Are you open on public holidays?',
  //           createdBy: 'Thanakorn Wichitkraisorn',
  //           createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  //         },
  //       ],
  //     },
  //     {
  //       id:           'contact-005',
  //       name:         'Napatsorn Kanchana',
  //       phone:        '+66867891234',
  //       email:        'napat@gmail.com',
  //       fbPsid:       null,
  //       waId:         null,
  //       lineUid:      null,
  //       source:       'MANUAL',
  //       tags:         ['corporate', 'follow-up'],
  //       assignedTo:   null,
  //       clientId:     'client-002',
  //       clientName:   'BKK Fitness',
  //       notes:        'HR manager at PTT. Looking for corporate fitness packages.',
  //       lastActiveAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  //       createdAt:    new Date(Date.now() - 86400000 * 10).toISOString(),
  //       activities:   [
  //         {
  //           id: 'act-010',
  //           type: 'NOTE',
  //           content: 'HR manager at PTT. Looking for corporate fitness packages.',
  //           createdBy: 'Nattawut C.',
  //           createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  //         },
  //       ],
  //     },
  //   ]

  //   let filtered = allContacts

  //   if (search) {
  //     filtered = filtered.filter((c) =>
  //       c.name.toLowerCase().includes(search) ||
  //       c.phone?.includes(search) ||
  //       c.email?.toLowerCase().includes(search) ||
  //       c.clientName.toLowerCase().includes(search)
  //     )
  //   }

  //   if (tag) {
  //     filtered = filtered.filter((c) => c.tags.includes(tag))
  //   }

  //   return HttpResponse.json({
  //     content:       filtered,
  //     totalElements: filtered.length,
  //     totalPages:    1,
  //     page:          0,
  //     size:          20,
  //   })
  // }),

  // http.get(`${BASE}/api/contacts/:id`, ({ params }) => {
  //   return HttpResponse.json({
  //     id:           params.id,
  //     name:         'Sirinda Rattanapruk',
  //     phone:        '+66812345678',
  //     email:        'sirinda@email.com',
  //     fbPsid:       'psid-001',
  //     waId:         null,
  //     lineUid:      null,
  //     source:       'MESSENGER',
  //     tags:         ['vip', 'interested'],
  //     assignedTo:   'Pim S.',
  //     clientId:     'client-001',
  //     clientName:   'Somjai Coffee',
  //     notes:        'Interested in catering packages for corporate events.',
  //     lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
  //     createdAt:    new Date(Date.now() - 86400000 * 3).toISOString(),
  //     activities:   [],
  //   })
  // }),

  // http.post(`${BASE}/api/contacts`, async ({ request }) => {
  //   const body = await request.json() as Record<string, unknown>
  //   return HttpResponse.json({
  //     id:          `contact-${Date.now()}`,
  //     ...body,
  //     fbPsid:      null,
  //     waId:        null,
  //     lineUid:     null,
  //     lastActiveAt: null,
  //     createdAt:   new Date().toISOString(),
  //     activities:  [],
  //   }, { status: 201 })
  // }),

  // http.patch(`${BASE}/api/contacts/:id`, async ({ params, request }) => {
  //   const body = await request.json() as Record<string, unknown>
  //   return HttpResponse.json({
  //     id: params.id,
  //     ...body,
  //     updatedAt: new Date().toISOString(),
  //   })
  // }),

  // http.delete(`${BASE}/api/contacts/:id`, () => {
  //   return HttpResponse.json({ message: 'Contact deleted' })
  // }),

  // http.post(`${BASE}/api/contacts/:id/notes`, async ({ request }) => {
  //   const body = await request.json() as { content: string }
  //   return HttpResponse.json({
  //     id:        `act-${Date.now()}`,
  //     type:      'NOTE',
  //     content:   body.content,
  //     createdBy: 'Nattawut C.',
  //     createdAt: new Date().toISOString(),
  //   }, { status: 201 })
  // }),

  // http.post(`${BASE}/api/contacts/:id/tags`, async ({  request }) => {
  //   const body = await request.json() as { tag: string }
  //   return HttpResponse.json({ tag: body.tag })
  // }),

  // http.delete(`${BASE}/api/contacts/:id/tags/:tag`, () => {
  //   return HttpResponse.json({ message: 'Tag removed' })
  // }),

  // http.patch(`${BASE}/api/contacts/:id/assign`, async ({  request }) => {
  //   const body = await request.json() as { assignedTo: string | null }
  //   return HttpResponse.json({ assignedTo: body.assignedTo })
  // }),

  // http.get(`${BASE}/api/contacts/export/csv`, () => {
  //   const csv = [
  //     'Name,Phone,Email,Source,Tags,Client,Assigned To,Created At',
  //     'Sirinda Rattanapruk,+66812345678,sirinda@email.com,MESSENGER,"vip,interested",Somjai Coffee,Pim S.,2026-05-29',
  //     'Krit Phongsathorn,+66898765432,,WHATSAPP,"new,follow-up",BKK Fitness,,2026-05-31',
  //     'Mallika Suwannarat,+66845678901,mallika@corp.co.th,LINE,"vip,corporate",Mango Resort,Nattawut C.,2026-05-18',
  //   ].join('\n')

  //   return new HttpResponse(csv, {
  //     headers: {
  //       'Content-Type':        'text/csv',
  //       'Content-Disposition': 'attachment; filename="contacts.csv"',
  //     },
  //   })
  // }),

  // ── Staff list (for assignment) ────────────────────────────────
  // http.get(`${BASE}/api/team`, () => {
  //   return HttpResponse.json([
  //     { id: 'user-001', name: 'Nattawut C.', role: 'OWNER'   },
  //     { id: 'user-002', name: 'Pim S.',      role: 'MANAGER' },
  //     { id: 'user-003', name: 'Korn T.',     role: 'STAFF'   },
  //   ])
  // }),

  // ── Analytics ─────────────────────────────────────────────────
  http.get(`${BASE}/api/analytics/overview`, () => {
    return HttpResponse.json({
      totalFollowers:  28450,
      followerGrowth:  3.2,
      totalReach:      142300,
      reachGrowth:     8.7,
      totalEngagement: 6820,
      engagementRate:  4.8,
      postsPublished:  24,
    })
  }),
  // ── Competitor tracking ────────────────────────────────────────
  http.get(`${BASE}/api/competitors`, ({ request }) => {
    const url      = new URL(request.url)
    const clientId = url.searchParams.get('clientId')

    const generateSnapshots = (base: number) => {
      const snaps = []
      let current = base
      for (let i = 29; i >= 0; i--) {
        const change = Math.floor(Math.random() * 400) - 100
        current = Math.max(0, current - change)
        snaps.push({
          date:      new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          followers: current,
          change,
        })
      }
      return snaps
    }

    const allCompetitors = [
      {
        id:             'comp-001',
        name:           'Cafe Amazon',
        platform:       'FACEBOOK',
        pageUrl:        'https://facebook.com/cafeamazon',
        pageId:         'cafeamazon',
        avatarUrl:      null,
        followers:      842000,
        followerGrowth: 2.4,
        avgEngagement:  3.8,
        postsPerWeek:   5,
        clientId:       'client-001',
        clientName:     'Somjai Coffee',
        snapshots:      generateSnapshots(842000),
        createdAt:      new Date(Date.now() - 86400000 * 30).toISOString(),
        lastSyncedAt:   new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id:             'comp-002',
        name:           'Black Canyon Coffee',
        platform:       'FACEBOOK',
        pageUrl:        'https://facebook.com/blackcanyoncoffee',
        pageId:         'blackcanyoncoffee',
        avatarUrl:      null,
        followers:      310000,
        followerGrowth: 1.2,
        avgEngagement:  2.1,
        postsPerWeek:   3,
        clientId:       'client-001',
        clientName:     'Somjai Coffee',
        snapshots:      generateSnapshots(310000),
        createdAt:      new Date(Date.now() - 86400000 * 20).toISOString(),
        lastSyncedAt:   new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id:             'comp-003',
        name:           'Fitness First Thailand',
        platform:       'FACEBOOK',
        pageUrl:        'https://facebook.com/fitnessfirstthailand',
        pageId:         'fitnessfirstthailand',
        avatarUrl:      null,
        followers:      520000,
        followerGrowth: 0.8,
        avgEngagement:  1.9,
        postsPerWeek:   4,
        clientId:       'client-002',
        clientName:     'BKK Fitness',
        snapshots:      generateSnapshots(520000),
        createdAt:      new Date(Date.now() - 86400000 * 15).toISOString(),
        lastSyncedAt:   new Date(Date.now() - 3600000).toISOString(),
      },
    ]

    const filtered = clientId
      ? allCompetitors.filter((c) => c.clientId === clientId)
      : allCompetitors

    return HttpResponse.json({
      content:       filtered,
      totalElements: filtered.length,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.get(`${BASE}/api/competitors/:id`, ({ params }) => {
    return HttpResponse.json({
      id:             params.id,
      name:           'Cafe Amazon',
      platform:       'FACEBOOK',
      pageUrl:        'https://facebook.com/cafeamazon',
      pageId:         'cafeamazon',
      avatarUrl:      null,
      followers:      842000,
      followerGrowth: 2.4,
      avgEngagement:  3.8,
      postsPerWeek:   5,
      clientId:       'client-001',
      clientName:     'Somjai Coffee',
      snapshots:      [],
      createdAt:      new Date(Date.now() - 86400000 * 30).toISOString(),
      lastSyncedAt:   new Date(Date.now() - 3600000).toISOString(),
    })
  }),

  http.post(`${BASE}/api/competitors`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id:             `comp-${Date.now()}`,
      ...body,
      avatarUrl:      null,
      followers:      0,
      followerGrowth: 0,
      avgEngagement:  0,
      postsPerWeek:   0,
      snapshots:      [],
      createdAt:      new Date().toISOString(),
      lastSyncedAt:   new Date().toISOString(),
    }, { status: 201 })
  }),

  http.delete(`${BASE}/api/competitors/:id`, () => {
    return HttpResponse.json({ message: 'Competitor removed' })
  }),

  http.post(`${BASE}/api/competitors/:id/sync`, () => {
    return HttpResponse.json({ message: 'Sync triggered' })
  }),

  // ── Benchmark groups ───────────────────────────────────────────
  http.get(`${BASE}/api/benchmarks`, () => {
    return HttpResponse.json({
      content: [
        {
          id:         'bench-001',
          name:       'Coffee Market Bangkok',
          clientId:   'client-001',
          clientName: 'Somjai Coffee',
          members: [
            { id: 'bm-001', name: 'Somjai Coffee',      platform: 'FACEBOOK', followers: 28450,  engagementRate: 4.8, postsPerWeek: 6, isOwn: true  },
            { id: 'bm-002', name: 'Cafe Amazon',         platform: 'FACEBOOK', followers: 842000, engagementRate: 3.8, postsPerWeek: 5, isOwn: false },
            { id: 'bm-003', name: 'Black Canyon Coffee', platform: 'FACEBOOK', followers: 310000, engagementRate: 2.1, postsPerWeek: 3, isOwn: false },
          ],
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          id:         'bench-002',
          name:       'Fitness Industry TH',
          clientId:   'client-002',
          clientName: 'BKK Fitness',
          members: [
            { id: 'bm-004', name: 'BKK Fitness',         platform: 'FACEBOOK', followers: 12800,  engagementRate: 5.2, postsPerWeek: 7, isOwn: true  },
            { id: 'bm-005', name: 'Fitness First Thailand',platform: 'FACEBOOK', followers: 520000, engagementRate: 1.9, postsPerWeek: 4, isOwn: false },
          ],
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ],
      totalElements: 2,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.post(`${BASE}/api/benchmarks`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id:        `bench-${Date.now()}`,
      ...body,
      members:   [],
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.delete(`${BASE}/api/benchmarks/:id`, () => {
    return HttpResponse.json({ message: 'Benchmark group deleted' })
  }),

  // ── White-label portals ────────────────────────────────────────
  http.get(`${BASE}/api/portals`, () => {
    return HttpResponse.json({
      content: [
        {
          id:          'portal-001',
          clientId:    'client-001',
          clientName:  'Somjai Coffee',
          status:      'ACTIVE',
          shareToken:  'tok-somjai-abc123',
          shareUrl:    'https://reports.pinnlo.io/somjai-coffee',
          password:    null,
          branding: {
            logoUrl:      null,
            primaryColor: '#1D9E75',
            companyName:  'Somjai Coffee',
            customDomain: null,
          },
          sections: [
            { id: 's-001', type: 'PAGE_OVERVIEW',    title: 'Page Overview',    enabled: true,  order: 1 },
            { id: 's-002', type: 'AUDIENCE_GROWTH',  title: 'Audience Growth',  enabled: true,  order: 2 },
            { id: 's-003', type: 'POST_PERFORMANCE', title: 'Post Performance', enabled: true,  order: 3 },
            { id: 's-004', type: 'TOP_POSTS',        title: 'Top Posts',        enabled: false, order: 4 },
            { id: 's-005', type: 'CUSTOM_MESSAGE',   title: 'Custom Message',   enabled: false, order: 5 },
          ],
          lastViewedAt: new Date(Date.now() - 86400000).toISOString(),
          viewCount:    14,
          createdAt:    new Date(Date.now() - 86400000 * 14).toISOString(),
        },
        {
          id:          'portal-002',
          clientId:    'client-002',
          clientName:  'BKK Fitness',
          status:      'PASSWORD_PROTECTED',
          shareToken:  'tok-bkkfit-xyz789',
          shareUrl:    'https://reports.pinnlo.io/bkk-fitness',
          password:    '••••••',
          branding: {
            logoUrl:      null,
            primaryColor: '#378ADD',
            companyName:  'BKK Fitness',
            customDomain: null,
          },
          sections: [
            { id: 's-006', type: 'PAGE_OVERVIEW',    title: 'Page Overview',    enabled: true, order: 1 },
            { id: 's-007', type: 'POST_PERFORMANCE', title: 'Post Performance', enabled: true, order: 2 },
            { id: 's-008', type: 'TOP_POSTS',        title: 'Top Posts',        enabled: true, order: 3 },
          ],
          lastViewedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          viewCount:    7,
          createdAt:    new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          id:          'portal-003',
          clientId:    'client-003',
          clientName:  'Mango Resort',
          status:      'INACTIVE',
          shareToken:  'tok-mango-def456',
          shareUrl:    'https://reports.pinnlo.io/mango-resort',
          password:    null,
          branding: {
            logoUrl:      null,
            primaryColor: '#EF9F27',
            companyName:  'Mango Resort',
            customDomain: null,
          },
          sections: [
            { id: 's-009', type: 'PAGE_OVERVIEW',   title: 'Page Overview',   enabled: true, order: 1 },
            { id: 's-010', type: 'AUDIENCE_GROWTH', title: 'Audience Growth', enabled: true, order: 2 },
          ],
          lastViewedAt: null,
          viewCount:    0,
          createdAt:    new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ],
      totalElements: 3,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.get(`${BASE}/api/portals/:id`, ({ params }) => {
    return HttpResponse.json({
      id:          params.id,
      clientId:    'client-001',
      clientName:  'Somjai Coffee',
      status:      'ACTIVE',
      shareToken:  'tok-somjai-abc123',
      shareUrl:    'https://reports.pinnlo.io/somjai-coffee',
      password:    null,
      branding: {
        logoUrl:      null,
        primaryColor: '#1D9E75',
        companyName:  'Somjai Coffee',
        customDomain: null,
      },
      sections: [
        { id: 's-001', type: 'PAGE_OVERVIEW',    title: 'Page Overview',    enabled: true,  order: 1 },
        { id: 's-002', type: 'AUDIENCE_GROWTH',  title: 'Audience Growth',  enabled: true,  order: 2 },
        { id: 's-003', type: 'POST_PERFORMANCE', title: 'Post Performance', enabled: true,  order: 3 },
        { id: 's-004', type: 'TOP_POSTS',        title: 'Top Posts',        enabled: false, order: 4 },
        { id: 's-005', type: 'CUSTOM_MESSAGE',   title: 'Custom Message',   enabled: false, order: 5 },
      ],
      lastViewedAt: new Date(Date.now() - 86400000).toISOString(),
      viewCount:    14,
      createdAt:    new Date(Date.now() - 86400000 * 14).toISOString(),
    })
  }),

  http.post(`${BASE}/api/portals`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id:          `portal-${Date.now()}`,
      ...body,
      status:      'INACTIVE',
      shareToken:  `tok-${Date.now()}`,
      shareUrl:    `https://reports.pinnlo.io/new-portal`,
      password:    null,
      sections:    [],
      lastViewedAt: null,
      viewCount:   0,
      createdAt:   new Date().toISOString(),
    }, { status: 201 })
  }),

  http.patch(`${BASE}/api/portals/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ id: params.id, ...body })
  }),

  http.delete(`${BASE}/api/portals/:id`, () => {
    return HttpResponse.json({ message: 'Portal deleted' })
  }),

  http.post(`${BASE}/api/portals/:id/regenerate-link`, ({ }) => {
    return HttpResponse.json({
      shareToken: `tok-new-${Date.now()}`,
      shareUrl:   `https://reports.pinnlo.io/portal-${Date.now()}`,
    })
  }),

  // ── Social listening ───────────────────────────────────────────
  http.get(`${BASE}/api/listening/queries`, () => {
    return HttpResponse.json({
      content: [
        {
          id:          'query-001',
          keyword:     'Somjai Coffee',
          platforms:   ['FACEBOOK', 'INSTAGRAM'],
          language:    'th',
          alertEnabled: true,
          alertFrequency: 'DAILY',
          mentionCount: 47,
          sentimentBreakdown: { positive: 32, neutral: 11, negative: 4 },
          createdAt:   new Date(Date.now() - 86400000 * 14).toISOString(),
          lastFoundAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id:          'query-002',
          keyword:     'somjai coffee review',
          platforms:   ['FACEBOOK'],
          language:    'th',
          alertEnabled: true,
          alertFrequency: 'REALTIME',
          mentionCount: 23,
          sentimentBreakdown: { positive: 18, neutral: 4, negative: 1 },
          createdAt:   new Date(Date.now() - 86400000 * 7).toISOString(),
          lastFoundAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id:          'query-003',
          keyword:     'BKK Fitness',
          platforms:   ['FACEBOOK', 'INSTAGRAM'],
          language:    'en',
          alertEnabled: false,
          alertFrequency: 'WEEKLY',
          mentionCount: 12,
          sentimentBreakdown: { positive: 8, neutral: 3, negative: 1 },
          createdAt:   new Date(Date.now() - 86400000 * 3).toISOString(),
          lastFoundAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      totalElements: 3,
      totalPages: 1,
      page: 0,
      size: 20,
    })
  }),

  http.get(`${BASE}/api/listening/queries/:id/mentions`, ({ params }) => {
    const mentions = [
      {
        id:         'mention-001',
        queryId:    params.id,
        keyword:    'Somjai Coffee',
        platform:   'FACEBOOK',
        content:    'Stopped by Somjai Coffee and the coffee was amazing! Great atmosphere too. Highly recommend! ☕',
        author:     'Napa Srirak',
        authorUrl:  'https://facebook.com/napasrirak',
        postUrl:    'https://facebook.com/posts/001',
        sentiment:  'POSITIVE',
        engagement: 234,
        foundAt:    new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id:         'mention-002',
        queryId:    params.id,
        keyword:    'Somjai Coffee',
        platform:   'INSTAGRAM',
        content:    'Good coffee but the queue was really long today at Somjai Coffee. Hope they fix this soon.',
        author:     'mark_bkk',
        authorUrl:  'https://instagram.com/mark_bkk',
        postUrl:    'https://instagram.com/p/002',
        sentiment:  'NEUTRAL',
        engagement: 87,
        foundAt:    new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id:         'mention-003',
        queryId:    params.id,
        keyword:    'Somjai Coffee',
        platform:   'FACEBOOK',
        content:    'Tried Somjai Coffee — the portion size is a bit small for the price, in my opinion.',
        author:     'Wiroj T.',
        authorUrl:  'https://facebook.com/wirojt',
        postUrl:    'https://facebook.com/posts/003',
        sentiment:  'NEGATIVE',
        engagement: 45,
        foundAt:    new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id:         'mention-004',
        queryId:    params.id,
        keyword:    'Somjai Coffee',
        platform:   'FACEBOOK',
        content:    'Somjai Coffee just opened a new branch! So close to my place. Super excited! 🎉',
        author:     'Patsara L.',
        authorUrl:  'https://facebook.com/patsaral',
        postUrl:    'https://facebook.com/posts/004',
        sentiment:  'POSITIVE',
        engagement: 512,
        foundAt:    new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ]

    return HttpResponse.json({
      content:       mentions,
      totalElements: mentions.length,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.post(`${BASE}/api/listening/queries`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id:           `query-${Date.now()}`,
      ...body,
      mentionCount: 0,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      createdAt:    new Date().toISOString(),
      lastFoundAt:  null,
    }, { status: 201 })
  }),

  http.delete(`${BASE}/api/listening/queries/:id`, () => {
    return HttpResponse.json({ message: 'Query deleted' })
  }),

  http.patch(`${BASE}/api/listening/queries/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ id: params.id, ...body })
  }),

  // ── Influencer discovery ───────────────────────────────────────
  http.get(`${BASE}/api/influencers`, ({ request }) => {
    const url      = new URL(request.url)
    const keyword  = url.searchParams.get('keyword')?.toLowerCase() ?? ''
    const tier     = url.searchParams.get('tier') ?? ''
    const platform = url.searchParams.get('platform') ?? ''

    const allInfluencers = [
      {
        id:             'inf-001',
        name:           'Mintra Kaewsai',
        handle:         '@mintra_foodie',
        platform:       'INSTAGRAM',
        avatarUrl:      null,
        followers:      87400,
        tier:           'MICRO',
        engagementRate: 6.2,
        avgLikes:       5419,
        avgComments:    423,
        postsPerWeek:   5,
        categories:     ['food', 'cafe', 'lifestyle'],
        location:       'Bangkok, Thailand',
        language:       'th',
        email:          'mintra@collab.th',
        profileUrl:     'https://instagram.com/mintra_foodie',
        score:          92,
        recentPosts: [
          { id: 'rp-001', content: 'Coffee crawl in Bangkok ☕', imageUrl: null, likes: 6200, comments: 480, shares: 120, postedAt: new Date(Date.now() - 86400000).toISOString() },
          { id: 'rp-002', content: 'Hidden gem cafe in Thonglor', imageUrl: null, likes: 5100, comments: 390, shares: 95, postedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
        ],
      },
      {
        id:             'inf-002',
        name:           'Kritchai Wongsak',
        handle:         '@krit_fitness',
        platform:       'FACEBOOK',
        avatarUrl:      null,
        followers:      42100,
        tier:           'MICRO',
        engagementRate: 4.8,
        avgLikes:       2021,
        avgComments:    189,
        postsPerWeek:   7,
        categories:     ['fitness', 'health', 'gym'],
        location:       'Bangkok, Thailand',
        language:       'th',
        email:          null,
        profileUrl:     'https://facebook.com/krit_fitness',
        score:          85,
        recentPosts: [
          { id: 'rp-003', content: 'Morning workout routine 💪', imageUrl: null, likes: 2300, comments: 210, shares: 67, postedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
        ],
      },
      {
        id:             'inf-003',
        name:           'Siriwan Phatak',
        handle:         '@siriwan_travel',
        platform:       'INSTAGRAM',
        avatarUrl:      null,
        followers:      234000,
        tier:           'MACRO',
        engagementRate: 3.4,
        avgLikes:       7956,
        avgComments:    612,
        postsPerWeek:   4,
        categories:     ['travel', 'hotel', 'lifestyle'],
        location:       'Chiang Mai, Thailand',
        language:       'th',
        email:          'siriwan@agency.co.th',
        profileUrl:     'https://instagram.com/siriwan_travel',
        score:          78,
        recentPosts: [
          { id: 'rp-004', content: 'Best resorts in Koh Samui 🌴', imageUrl: null, likes: 8900, comments: 720, shares: 340, postedAt: new Date(Date.now() - 86400000).toISOString() },
        ],
      },
      {
        id:             'inf-004',
        name:           'Aung Ko Win',
        handle:         '@aungkowin_mm',
        platform:       'FACEBOOK',
        avatarUrl:      null,
        followers:      9800,
        tier:           'NANO',
        engagementRate: 8.9,
        avgLikes:       872,
        avgComments:    134,
        postsPerWeek:   6,
        categories:     ['food', 'local', 'myanmar'],
        location:       'Yangon, Myanmar',
        language:       'my',
        email:          null,
        profileUrl:     'https://facebook.com/aungkowin_mm',
        score:          71,
        recentPosts: [],
      },
      {
        id:             'inf-005',
        name:           'Lalita Phommavong',
        handle:         '@lalita_laos',
        platform:       'FACEBOOK',
        avatarUrl:      null,
        followers:      5600,
        tier:           'NANO',
        engagementRate: 11.2,
        avgLikes:       627,
        avgComments:    98,
        postsPerWeek:   4,
        categories:     ['lifestyle', 'laos', 'travel'],
        location:       'Vientiane, Laos',
        language:       'lo',
        email:          null,
        profileUrl:     'https://facebook.com/lalita_laos',
        score:          65,
        recentPosts: [],
      },
    ]

    let filtered = allInfluencers
    if (keyword) {
      filtered = filtered.filter((i) =>
        i.name.toLowerCase().includes(keyword) ||
        i.handle.toLowerCase().includes(keyword) ||
        i.categories.some((c) => c.includes(keyword))
      )
    }
    if (tier)     filtered = filtered.filter((i) => i.tier === tier)
    if (platform) filtered = filtered.filter((i) => i.platform === platform)

    return HttpResponse.json({
      content:       filtered,
      totalElements: filtered.length,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.get(`${BASE}/api/influencers/:id`, ({ params }) => {
    return HttpResponse.json({
      id:             params.id,
      name:           'Mintra Kaewsai',
      handle:         '@mintra_foodie',
      platform:       'INSTAGRAM',
      avatarUrl:      null,
      followers:      87400,
      tier:           'MICRO',
      engagementRate: 6.2,
      avgLikes:       5419,
      avgComments:    423,
      postsPerWeek:   5,
      categories:     ['food', 'cafe', 'lifestyle'],
      location:       'Bangkok, Thailand',
      language:       'th',
      email:          'mintra@collab.th',
      profileUrl:     'https://instagram.com/mintra_foodie',
      score:          92,
      recentPosts: [
        { id: 'rp-001', content: 'Coffee crawl in Bangkok ☕', imageUrl: null, likes: 6200, comments: 480, shares: 120, postedAt: new Date(Date.now() - 86400000).toISOString() },
        { id: 'rp-002', content: 'Hidden gem cafe in Thonglor', imageUrl: null, likes: 5100, comments: 390, shares: 95, postedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      ],
    })
  }),

  // ── API key management ─────────────────────────────────────────
  http.get(`${BASE}/api/developer/keys`, () => {
    return HttpResponse.json([
      {
        id:             'key-001',
        name:           'Production integration',
        keyPrefix:      'pk_live_4xK9m...',
        status:         'ACTIVE',
        permissions:    ['posts:read', 'posts:write', 'contacts:read', 'analytics:read'],
        lastUsedAt:     new Date(Date.now() - 3600000).toISOString(),
        expiresAt:      null,
        createdAt:      new Date(Date.now() - 86400000 * 30).toISOString(),
        requestsToday:  1247,
        requestsMonth:  28943,
      },
      {
        id:             'key-002',
        name:           'Staging / testing',
        keyPrefix:      'pk_test_9jR2n...',
        status:         'ACTIVE',
        permissions:    ['posts:read', 'contacts:read'],
        lastUsedAt:     new Date(Date.now() - 86400000 * 2).toISOString(),
        expiresAt:      new Date(Date.now() + 86400000 * 30).toISOString(),
        createdAt:      new Date(Date.now() - 86400000 * 7).toISOString(),
        requestsToday:  43,
        requestsMonth:  892,
      },
      {
        id:             'key-003',
        name:           'Old webhook integration',
        keyPrefix:      'pk_live_2mL7p...',
        status:         'REVOKED',
        permissions:    ['posts:read'],
        lastUsedAt:     new Date(Date.now() - 86400000 * 14).toISOString(),
        expiresAt:      null,
        createdAt:      new Date(Date.now() - 86400000 * 60).toISOString(),
        requestsToday:  0,
        requestsMonth:  0,
      },
    ])
  }),

  http.post(`${BASE}/api/developer/keys`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id:             `key-${Date.now()}`,
      name:           body.name,
      keyPrefix:      'pk_live_NEW...',
      fullKey:        `pk_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
      status:         'ACTIVE',
      permissions:    body.permissions ?? [],
      lastUsedAt:     null,
      expiresAt:      body.expiresAt ?? null,
      createdAt:      new Date().toISOString(),
      requestsToday:  0,
      requestsMonth:  0,
    }, { status: 201 })
  }),

  http.delete(`${BASE}/api/developer/keys/:id`, () => {
    return HttpResponse.json({ message: 'API key revoked' })
  }),

  http.get(`${BASE}/api/developer/usage`, () => {
    return HttpResponse.json({
      requestsToday:  1290,
      requestsMonth:  29835,
      monthlyLimit:   100000,
      successRate:    99.2,
      avgResponseMs:  142,
      topEndpoints: [
        { path: '/api/v1/posts',      count: 8420 },
        { path: '/api/v1/contacts',   count: 6234 },
        { path: '/api/v1/analytics',  count: 4891 },
        { path: '/api/v1/clients',    count: 3102 },
        { path: '/api/v1/webhooks',   count: 2188 },
      ],
    })
  }),
  // ── Analytics ──────────────────────────────────────────────────
  http.get(`${BASE}/api/analytics/overview`, () => {
    return HttpResponse.json({
      totalFollowers:  28450,
      followerGrowth:  3.2,
      totalReach:      142300,
      reachGrowth:     8.7,
      totalEngagement: 6820,
      engagementRate:  4.8,
      postsPublished:  24,
    })
  }),

  http.get(`${BASE}/api/analytics/history`, ({ request }) => {
    const url   = new URL(request.url)
    const days  = parseInt(url.searchParams.get('days') ?? '30')

    const data = Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() - (days - 1 - i) * 86400000)
      return {
        date:       date.toISOString().split('T')[0],
        followers:  25000 + Math.floor(i * 120 + Math.random() * 200),
        reach:      3000  + Math.floor(Math.random() * 2000),
        engagement: 150   + Math.floor(Math.random() * 300),
        posts:      Math.random() > 0.6 ? 1 : 0,
      }
    })

    return HttpResponse.json({ data, days })
  }),

  http.get(`${BASE}/api/analytics/posts`, () => {
    return HttpResponse.json({
      content: [
        {
          id:             'post-001',
          content:        'Special promotion! 20% off all new menu itemsทุกรายการ 🎉',
          platform:       'FACEBOOK',
          clientName:     'Somjai Coffee',
          publishedAt:    new Date(Date.now() - 86400000).toISOString(),
          likes:          1243,
          comments:       89,
          shares:         234,
          reach:          18420,
          engagementRate: 8.5,
        },
        {
          id:             'post-002',
          content:        'New workout program starting Monday. Limited slots available! 💪',
          platform:       'FACEBOOK',
          clientName:     'BKK Fitness',
          publishedAt:    new Date(Date.now() - 86400000 * 2).toISOString(),
          likes:          892,
          comments:       124,
          shares:         67,
          reach:          12300,
          engagementRate: 7.2,
        },
        {
          id:             'post-003',
          content:        'Welcome to travel season! Relax at special prices ✈️🌴',
          platform:       'INSTAGRAM',
          clientName:     'Mango Resort',
          publishedAt:    new Date(Date.now() - 86400000 * 3).toISOString(),
          likes:          2341,
          comments:       198,
          shares:         412,
          reach:          34200,
          engagementRate: 8.6,
        },
        {
          id:             'post-004',
          content:        'Grand opening of our second branch in Thonglor! 🎊',
          platform:       'FACEBOOK',
          clientName:     'Somjai Coffee',
          publishedAt:    new Date(Date.now() - 86400000 * 5).toISOString(),
          likes:          3102,
          comments:       287,
          shares:         891,
          reach:          52100,
          engagementRate: 9.2,
        },
        {
          id:             'post-005',
          content:        'Flash sale! 50% off all memberships today only ⚡',
          platform:       'FACEBOOK',
          clientName:     'BKK Fitness',
          publishedAt:    new Date(Date.now() - 86400000 * 7).toISOString(),
          likes:          567,
          comments:       43,
          shares:         123,
          reach:          8900,
          engagementRate: 5.1,
        },
      ],
      totalElements: 5,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.get(`${BASE}/api/analytics/heatmap`, () => {
    const days    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const hours   = Array.from({ length: 24 }, (_, i) => i)
    const heatmap = days.map((day) =>
      hours.map((hour) => {
        // Peak hours: 7-9am, 12-1pm, 7-10pm
        let score = Math.random() * 20
        if (hour >= 7  && hour <= 9)  score += 60 + Math.random() * 30
        if (hour >= 12 && hour <= 13) score += 50 + Math.random() * 30
        if (hour >= 19 && hour <= 22) score += 70 + Math.random() * 30
        // Weekend boost evenings
        if ((day === 'Sat' || day === 'Sun') && hour >= 18) score += 20
        return {
          day,
          hour,
          score: Math.min(100, Math.round(score)),
          label: `${day} ${hour}:00`,
        }
      })
    )
    return HttpResponse.json({ heatmap, timezone: 'ICT (UTC+7)' })
  }),
  // ── Settings ───────────────────────────────────────────────────
  http.get(`${BASE}/api/settings/agency`, () => {
    return HttpResponse.json({
      id:           'agency-001',
      name:         'NC Digital Agency',
      email:        'nattawut@ncdigital.co.th',
      phone:        '+66812345678',
      website:      'https://ncdigital.co.th',
      timezone:     'Asia/Bangkok',
      language:     'th',
      plan:         'AGENCY',
      createdAt:    new Date(Date.now() - 86400000 * 90).toISOString(),
    })
  }),

  http.patch(`${BASE}/api/settings/agency`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ ...body, updatedAt: new Date().toISOString() })
  }),

  http.get(`${BASE}/api/settings/notifications`, () => {
    return HttpResponse.json({
      emailOnNewLead:       true,
      emailOnPostFailed:    true,
      emailOnApprovalNeeded: true,
      emailDigestFrequency: 'DAILY',
      inAppNewLead:         true,
      inAppPostPublished:   true,
      inAppApproval:        true,
    })
  }),

  http.patch(`${BASE}/api/settings/notifications`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ ...body })
  }),

  // http.get(`${BASE}/api/settings/team`, () => {
  //   return HttpResponse.json([
  //     {
  //       id:        'user-001',
  //       name:      'Nattawut Chaimongkol',
  //       email:     'nattawut@ncdigital.co.th',
  //       role:      'OWNER',
  //       status:    'ACTIVE',
  //       joinedAt:  new Date(Date.now() - 86400000 * 90).toISOString(),
  //       lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
  //     },
  //     {
  //       id:        'user-002',
  //       name:      'Pim Suwannapha',
  //       email:     'pim@ncdigital.co.th',
  //       role:      'MANAGER',
  //       status:    'ACTIVE',
  //       joinedAt:  new Date(Date.now() - 86400000 * 45).toISOString(),
  //       lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
  //     },
  //     {
  //       id:        'user-003',
  //       name:      'Korn Thirawat',
  //       email:     'korn@ncdigital.co.th',
  //       role:      'STAFF',
  //       status:    'ACTIVE',
  //       joinedAt:  new Date(Date.now() - 86400000 * 14).toISOString(),
  //       lastActiveAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  //     },
  //     {
  //       id:        'user-004',
  //       name:      'Invite pending',
  //       email:     'new@ncdigital.co.th',
  //       role:      'STAFF',
  //       status:    'PENDING',
  //       joinedAt:  null,
  //       lastActiveAt: null,
  //     },
  //   ])
  // }),

  // http.post(`${BASE}/api/settings/team/invite`, async ({ request }) => {
  //   const body = await request.json() as Record<string, unknown>
  //   return HttpResponse.json({
  //     id:        `user-${Date.now()}`,
  //     name:      'Invite pending',
  //     email:     body.email,
  //     role:      body.role,
  //     status:    'PENDING',
  //     joinedAt:  null,
  //     lastActiveAt: null,
  //   }, { status: 201 })
  // }),

  // http.delete(`${BASE}/api/settings/team/:id`, () => {
  //   return HttpResponse.json({ message: 'Member removed' })
  // }),

  // http.patch(`${BASE}/api/settings/team/:id`, async ({ params, request }) => {
  //   const body = await request.json() as Record<string, unknown>
  //   return HttpResponse.json({ id: params.id, ...body })
  // }),

  http.get(`${BASE}/api/settings/platforms`, () => {
    return HttpResponse.json([
      {
        id:          'plat-001',
        type:        'FACEBOOK',
        name:        'Somjai Coffee Official',
        pageId:      '123456789',
        status:      'CONNECTED',
        tokenExpiresAt: new Date(Date.now() + 86400000 * 45).toISOString(),
        connectedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id:          'plat-002',
        type:        'INSTAGRAM',
        name:        'somjaicoffee_official',
        pageId:      '987654321',
        status:      'CONNECTED',
        tokenExpiresAt: new Date(Date.now() + 86400000 * 45).toISOString(),
        connectedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id:          'plat-003',
        type:        'FACEBOOK',
        name:        'BKK Fitness Page',
        pageId:      '111222333',
        status:      'TOKEN_EXPIRED',
        tokenExpiresAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        connectedAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      },
      {
        id:          'plat-004',
        type:        'LINE',
        name:        'Mango Resort LINE OA',
        pageId:      'line-oa-001',
        status:      'CONNECTED',
        tokenExpiresAt: null,
        connectedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    ])
  }),

  http.delete(`${BASE}/api/settings/platforms/:id`, () => {
    return HttpResponse.json({ message: 'Platform disconnected' })
  }),

  http.post(`${BASE}/api/settings/platforms/:id/reconnect`, () => {
    return HttpResponse.json({ message: 'Reconnection initiated' })
  }),

  // ── Inbox ──────────────────────────────────────────────────────
  http.get(`${BASE}/api/inbox/threads`, ({ request }) => {
    const url      = new URL(request.url)
    const type     = url.searchParams.get('type')     ?? ''
    const platform = url.searchParams.get('platform') ?? ''
    const status   = url.searchParams.get('status')   ?? ''

    const allThreads = [
      {
        id:          'thread-001',
        type:        'COMMENT',
        platform:    'FACEBOOK',
        clientId:    'client-001',
        clientName:  'Somjai Coffee',
        status:      'OPEN',
        author:      'Wiroj Tanaka',
        authorId:    'fb-user-001',
        preview:     'The price is too high for the portion size. Not worth it at all.',
        unreadCount: 2,
        postContent: 'Special promotion! 20% off all new menu items',
        lastMessageAt: new Date(Date.now() - 1800000).toISOString(),
        assignedTo:  null,
        messages: [
          {
            id:      'msg-001',
            type:    'INBOUND',
            content: 'The price is too high for the portion size. Not worth it at all.',
            author:  'Wiroj Tanaka',
            sentAt:  new Date(Date.now() - 3600000).toISOString(),
            isRead:  false,
          },
          {
            id:      'msg-002',
            type:    'INBOUND',
            content: 'What do you all think about this place?',
            author:  'Wiroj Tanaka',
            sentAt:  new Date(Date.now() - 1800000).toISOString(),
            isRead:  false,
          },
        ],
      },
      {
        id:          'thread-002',
        type:        'DM',
        platform:    'FACEBOOK',
        clientId:    'client-001',
        clientName:  'Somjai Coffee',
        status:      'OPEN',
        author:      'Sirinda Rattanapruk',
        authorId:    'fb-user-002',
        preview:     'Enquiring about catering services',
        unreadCount: 1,
        postContent: null,
        lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
        assignedTo:  'Pim S.',
        messages: [
          {
            id:      'msg-003',
            type:    'INBOUND',
            content: 'Hello, I would like to enquire about catering for a company event.',
            author:  'Sirinda Rattanapruk',
            sentAt:  new Date(Date.now() - 7200000).toISOString(),
            isRead:  false,
          },
          {
            id:      'msg-004',
            type:    'OUTBOUND',
            content: 'Hi there! Happy to help. Could you let us know the number of guests and preferred date?',
            author:  'Pim S.',
            sentAt:  new Date(Date.now() - 3600000).toISOString(),
            isRead:  true,
          },
        ],
      },
      {
        id:          'thread-003',
        type:        'COMMENT',
        platform:    'INSTAGRAM',
        clientId:    'client-003',
        clientName:  'Mango Resort',
        status:      'OPEN',
        author:      'mark_bkk',
        authorId:    'ig-user-001',
        preview:     'Beautiful place! How do I book?',
        unreadCount: 1,
        postContent: 'Welcome to travel season! Relax at special prices',
        lastMessageAt: new Date(Date.now() - 10800000).toISOString(),
        assignedTo:  null,
        messages: [
          {
            id:      'msg-005',
            type:    'INBOUND',
            content: 'Beautiful place! How do I book a room for December?',
            author:  'mark_bkk',
            sentAt:  new Date(Date.now() - 10800000).toISOString(),
            isRead:  false,
          },
        ],
      },
      {
        id:          'thread-004',
        type:        'DM',
        platform:    'LINE',
        clientId:    'client-003',
        clientName:  'Mango Resort',
        status:      'OPEN',
        author:      'Mallika Suwannarat',
        authorId:    'line-user-001',
        preview:     'Looking to book 15 rooms for March',
        unreadCount: 0,
        postContent: null,
        lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
        assignedTo:  'Nattawut C.',
        messages: [
          {
            id:      'msg-006',
            type:    'INBOUND',
            content: 'We would like to book 15 rooms for a corporate retreat in March.',
            author:  'Mallika Suwannarat',
            sentAt:  new Date(Date.now() - 86400000).toISOString(),
            isRead:  true,
          },
          {
            id:      'msg-007',
            type:    'OUTBOUND',
            content: 'Thank you for reaching out! We will send a quotation to your registered email shortly.',
            author:  'Nattawut C.',
            sentAt:  new Date(Date.now() - 82800000).toISOString(),
            isRead:  true,
          },
        ],
      },
      {
        id:          'thread-005',
        type:        'COMMENT',
        platform:    'FACEBOOK',
        clientId:    'client-002',
        clientName:  'BKK Fitness',
        status:      'CLOSED',
        author:      'Krit Phongsathorn',
        authorId:    'fb-user-003',
        preview:     'What are your membership prices?',
        unreadCount: 0,
        postContent: 'New workout program starting Monday!',
        lastMessageAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        assignedTo:  null,
        messages: [
          {
            id:      'msg-008',
            type:    'INBOUND',
            content: 'What are your membership prices?',
            author:  'Krit Phongsathorn',
            sentAt:  new Date(Date.now() - 86400000 * 2).toISOString(),
            isRead:  true,
          },
          {
            id:      'msg-009',
            type:    'OUTBOUND',
            content: 'Hi! Our membership starts at 990฿/month. Check our full package details via the link in our profile.',
            author:  'Pim S.',
            sentAt:  new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
            isRead:  true,
          },
        ],
      },
    ]

    let filtered = allThreads
    if (type)     filtered = filtered.filter((t) => t.type === type)
    if (platform) filtered = filtered.filter((t) => t.platform === platform)
    if (status)   filtered = filtered.filter((t) => t.status === status)

    return HttpResponse.json({
      content:       filtered,
      totalElements: filtered.length,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.post(`${BASE}/api/inbox/threads/:id/reply`, async ({ request }) => {
    const body = await request.json() as { content: string }
    return HttpResponse.json({
      id:      `msg-${Date.now()}`,
      type:    'OUTBOUND',
      content: body.content,
      author:  'Nattawut C.',
      sentAt:  new Date().toISOString(),
      isRead:  true,
    }, { status: 201 })
  }),

  http.patch(`${BASE}/api/inbox/threads/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ id: params.id, ...body })
  }),

  http.delete(`${BASE}/api/inbox/threads/:id/comment`, () => {
    return HttpResponse.json({ message: 'Comment hidden' })
  }),
  // ── Message templates ──────────────────────────────────────────
  http.get(`${BASE}/api/templates`, ({ request }) => {
    const url      = new URL(request.url)
    const category = url.searchParams.get('category') ?? ''
    const platform = url.searchParams.get('platform') ?? ''
    const search   = url.searchParams.get('search')?.toLowerCase() ?? ''

    const allTemplates = [
      {
        id:         'tpl-001',
        name:       'Welcome greeting',
        content:    'Hello {{name}}, welcome to {{brand}}! We are happy to help you with anything you need. 😊',
        category:   'GREETING',
        platform:   'ALL',
        variables:  ['{{name}}', '{{brand}}'],
        usageCount: 142,
        createdBy:  'Nattawut C.',
        createdAt:  new Date(Date.now() - 86400000 * 30).toISOString(),
        updatedAt:  new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id:         'tpl-002',
        name:       'Opening hours FAQ',
        content:    'We are open every day during {{hours}}. Feel free to ask if you need any more information!',
        category:   'FAQ',
        platform:   'FACEBOOK',
        variables:  ['{{hours}}'],
        usageCount: 89,
        createdBy:  'Pim S.',
        createdAt:  new Date(Date.now() - 86400000 * 14).toISOString(),
        updatedAt:  new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id:         'tpl-003',
        name:       'Promotion announcement',
        content:    '🎉 Special offer! {{discount}} off {{product}} — available on {{date}} only. Do not miss out!',
        category:   'PROMOTION',
        platform:   'ALL',
        variables:  ['{{discount}}', '{{product}}', '{{date}}'],
        usageCount: 234,
        createdBy:  'Nattawut C.',
        createdAt:  new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt:  new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id:         'tpl-004',
        name:       'Follow-up after inquiry',
        content:    'Hello {{name}}, just following up to see if you are still interested in {{product}}. We are always happy to help! 🙏',
        category:   'FOLLOW_UP',
        platform:   'WHATSAPP',
        variables:  ['{{name}}', '{{product}}'],
        usageCount: 67,
        createdBy:  'Pim S.',
        createdAt:  new Date(Date.now() - 86400000 * 10).toISOString(),
        updatedAt:  new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id:         'tpl-005',
        name:       'Closing message',
        content:    'Thank you so much, {{name}}! Feel free to reach out anytime you have questions. Have a great day! 😊',
        category:   'CLOSING',
        platform:   'ALL',
        variables:  ['{{name}}'],
        usageCount: 198,
        createdBy:  'Nattawut C.',
        createdAt:  new Date(Date.now() - 86400000 * 20).toISOString(),
        updatedAt:  new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id:         'tpl-006',
        name:       'LINE booking confirmation',
        content:    'Booking confirmed! 📋\nName: {{name}}\nDate: {{date}}\nTime: {{time}}\nGuests: {{guests}}\n\nIf you need to make any changes, please contact us at least 24 hours in advance.',
        category:   'CUSTOM',
        platform:   'LINE',
        variables:  ['{{name}}', '{{date}}', '{{time}}', '{{guests}}'],
        usageCount: 45,
        createdBy:  'Korn T.',
        createdAt:  new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt:  new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ]

    let filtered = allTemplates
    if (category) filtered = filtered.filter((t) => t.category === category)
    if (platform) filtered = filtered.filter((t) => t.platform === platform || t.platform === 'ALL')
    if (search)   filtered = filtered.filter((t) =>
      t.name.toLowerCase().includes(search) ||
      t.content.toLowerCase().includes(search)
    )

    return HttpResponse.json({
      content:       filtered,
      totalElements: filtered.length,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.post(`${BASE}/api/templates`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const content = body.content as string
    const variables = (content.match(/\{\{[^}]+\}\}/g) ?? [])
      .filter((v, i, a) => a.indexOf(v) === i)
    return HttpResponse.json({
      id:         `tpl-${Date.now()}`,
      ...body,
      variables,
      usageCount: 0,
      createdBy:  'Nattawut C.',
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    }, { status: 201 })
  }),

  http.patch(`${BASE}/api/templates/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    const content = (body.content ?? '') as string
    const variables = (content.match(/\{\{[^}]+\}\}/g) ?? [])
      .filter((v, i, a) => a.indexOf(v) === i)
    return HttpResponse.json({
      id: params.id,
      ...body,
      variables,
      updatedAt: new Date().toISOString(),
    })
  }),

  http.delete(`${BASE}/api/templates/:id`, () => {
    return HttpResponse.json({ message: 'Template deleted' })
  }),
  // ── AI features ────────────────────────────────────────────────
  http.post(`${BASE}/api/v1/ai/caption`, async ({ request }) => {
    const { topic,  clientName } =
      await request.json() as Record<string, string>

    // Simulate AI thinking time
    await new Promise((r) => setTimeout(r, 1800))

    const brand = clientName ?? 'แบรนด์ของเรา'

    const captions = [
      `🌟 ${topic}\n\nAt ${brand}, we believe every experience should be special. Come see for yourself! ✨\n\n#${brand.replace(/\s/g, '')} #Quality #Thailand`,
      `Wondering why thousands of customers trust ${brand}?\n\nBecause our ${topic} is unlike anything else. 💪\n\nTry it and find out why!`,
      `🔥 Special offer from ${brand}!\n\n${topic}\n\n⏰ Don't miss out — contact us today!\n👇 Click the link in bio`,
    ]

    return HttpResponse.json({
      captions,
      usageRemaining: 49,
      model: 'claude-sonnet-4-20250514',
    })
  }),

  http.post(`${BASE}/api/v1/ai/reply`, async ({ request }) => {
  await new Promise((r) => setTimeout(r, 1200))
  const { message } =
    await request.json() as Record<string, string>

  // Detect language from the message content
  const hasThai = /[\u0E00-\u0E7F]/.test(message)
  const hasBurmese = /[\u1000-\u109F]/.test(message)
  const hasLao = /[\u0E80-\u0EFF]/.test(message)

  let suggestions: string[]

  if (hasThai) {
    suggestions = [
      'สวัสดีค่ะ ขอบคุณที่ติดต่อมานะคะ ทางเราจะดำเนินการให้โดยเร็วที่สุดค่ะ 😊',
      'ขอบคุณสำหรับคำถามค่ะ ยินดีให้ข้อมูลเพิ่มเติมเสมอนะคะ สามารถทักมาได้เลยค่ะ',
      'รับทราบค่ะ ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมงนะคะ ขอบคุณที่ให้ความไว้วางใจค่ะ 🙏',
    ]
  } else if (hasBurmese) {
    suggestions = [
      'မင်္ဂလာပါ။ ဆက်သွယ်တဲ့အတွက် ကျေးဇူးတင်ပါတယ်။ အမြန်ဆုံးကူညီပေးပါမယ်။ 😊',
      'မေးခွန်းအတွက် ကျေးဇူးတင်ပါတယ်။ နောက်ထပ်သိချင်တာရှိရင် မေးနိုင်ပါတယ်။',
      'သိရှိပါတယ်။ ၂၄ နာရီအတွင်း ပြန်လည်ဆက်သွယ်ပေးပါမယ်။ 🙏',
    ]
  } else if (hasLao) {
    suggestions = [
      'ສະບາຍດີ. ຂອບໃຈທີ່ຕິດຕໍ່ມາ. ພວກເຮົາຈະຊ່ວຍໂດຍໄວທີ່ສຸດ. 😊',
      'ຂອບໃຈສຳລັບຄຳຖາມ. ຍິນດີໃຫ້ຂໍ້ມູນເພີ່ມເຕີມສະເໝີ.',
      'ຮັບຊາບແລ້ວ. ທີມງານຈະຕິດຕໍ່ກັບພາຍໃນ 24 ຊົ່ວໂມງ. 🙏',
    ]
  } else {
    // Default to English
    suggestions = [
      'Hi there! Thanks for reaching out. We\'ll get back to you as soon as possible. 😊',
      'Thank you for your question! We\'d be happy to provide more information. Feel free to ask anything.',
      'Got it! Our team will follow up within 24 hours. Thank you for your patience. 🙏',
    ]
  }

  return HttpResponse.json({
    suggestions,
    usageRemaining: 99,
  })
}),

  http.post(`${BASE}/api/v1/ai/image`, async () => {
    await new Promise((r) => setTimeout(r, 2500))
    return HttpResponse.json({
      images: [
        {
          id:  `img-${Date.now()}-1`,
          url: 'https://placehold.co/1080x1080/1D9E75/white?text=AI+Generated+Image+1',
          prompt: 'Generated image 1',
        },
        {
          id:  `img-${Date.now()}-2`,
          url: 'https://placehold.co/1080x1080/378ADD/white?text=AI+Generated+Image+2',
          prompt: 'Generated image 2',
        },
        {
          id:  `img-${Date.now()}-3`,
          url: 'https://placehold.co/1080x1080/7F77DD/white?text=AI+Generated+Image+3',
          prompt: 'Generated image 3',
        },
      ],
      usageRemaining: 24,
    })
  }),

  // ── Broadcast campaigns ────────────────────────────────────────
  http.get(`${BASE}/api/broadcasts`, ({ request }) => {
    const url      = new URL(request.url)
    const clientId = url.searchParams.get('clientId') ?? ''
    const status   = url.searchParams.get('status')   ?? ''

    const allBroadcasts = [
      {
        id:             'bc-001',
        name:           'Weekend promotion — Somjai Coffee',
        platform:       'FACEBOOK',
        clientId:       'client-001',
        clientName:     'Somjai Coffee',
        status:         'SENT',
        message:        'Hi {{name}} 🎉 Special promotion today — 20% off all menu items this Saturday and Sunday only!',
        templateId:     'tpl-003',
        recipientCount: 142,
        sentCount:      138,
        failedCount:    4,
        openRate:       67.4,
        scheduledAt:    new Date(Date.now() - 86400000 * 2).toISOString(),
        sentAt:         new Date(Date.now() - 86400000 * 2).toISOString(),
        createdBy:      'Pim S.',
        createdAt:      new Date(Date.now() - 86400000 * 3).toISOString(),
        tags:           ['vip', 'interested'],
      },
      {
        id:             'bc-002',
        name:           'New membership packages — BKK Fitness',
        platform:       'LINE',
        clientId:       'client-002',
        clientName:     'BKK Fitness',
        status:         'SCHEDULED',
        message:        'Hi {{name}} 💪 We have launched new membership packages! Sign up this month and get 30% off.',
        templateId:     null,
        recipientCount: 89,
        sentCount:      0,
        failedCount:    0,
        openRate:       null,
        scheduledAt:    new Date(Date.now() + 86400000).toISOString(),
        sentAt:         null,
        createdBy:      'Nattawut C.',
        createdAt:      new Date(Date.now() - 3600000).toISOString(),
        tags:           ['follow-up'],
      },
      {
        id:             'bc-003',
        name:           'Resort high season announcement',
        platform:       'WHATSAPP',
        clientId:       'client-003',
        clientName:     'Mango Resort',
        status:         'DRAFT',
        message:        'Dear {{name}}, high season is coming! Book before December 1 and get 15% off. Limited rooms available.',
        templateId:     null,
        recipientCount: 0,
        sentCount:      0,
        failedCount:    0,
        openRate:       null,
        scheduledAt:    null,
        sentAt:         null,
        createdBy:      'Nattawut C.',
        createdAt:      new Date(Date.now() - 7200000).toISOString(),
        tags:           ['corporate', 'vip'],
      },
    ]

    let filtered = allBroadcasts
    if (clientId) filtered = filtered.filter((b) => b.clientId === clientId)
    if (status)   filtered = filtered.filter((b) => b.status === status)

    return HttpResponse.json({
      content:       filtered,
      totalElements: filtered.length,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.post(`${BASE}/api/broadcasts`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id:             `bc-${Date.now()}`,
      ...body,
      status:         body.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      recipientCount: Math.floor(Math.random() * 50) + 10,
      sentCount:      0,
      failedCount:    0,
      openRate:       null,
      sentAt:         null,
      createdBy:      'Nattawut C.',
      createdAt:      new Date().toISOString(),
    }, { status: 201 })
  }),

  http.delete(`${BASE}/api/broadcasts/:id`, () => {
    return HttpResponse.json({ message: 'Broadcast deleted' })
  }),

  http.post(`${BASE}/api/broadcasts/:id/send`, async ({ params }) => {
    await new Promise((r) => setTimeout(r, 800))
    return HttpResponse.json({
      id:      params.id,
      status:  'SENDING',
      sentAt:  new Date().toISOString(),
    })
  }),

  http.post(`${BASE}/api/broadcasts/:id/cancel`, async ({ params }) => {
    return HttpResponse.json({
      id:     params.id,
      status: 'DRAFT',
    })
  }),
  // ── Email campaigns ────────────────────────────────────────────
  http.get(`${BASE}/api/email-campaigns`, ({ request }) => {
    const url      = new URL(request.url)
    const clientId = url.searchParams.get('clientId') ?? ''
    const status   = url.searchParams.get('status')   ?? ''

    const allCampaigns = [
      {
        id:             'em-001',
        name:           'November newsletter — Somjai Coffee',
        subject:        '☕ ข่าวสารประจำเดือนพฤศจิกายนจาก Somjai Coffee',
        previewText:    'โปรโมชั่นใหม่และเมนูแนะนำสำหรับเดือนนี้',
        body:           '<h2>สวัสดีค่ะ {{name}}</h2><p>เดือนนี้เรามีโปรโมชั่นสุดพิเศษมาฝากกันค่ะ...</p>',
        clientId:       'client-001',
        clientName:     'Somjai Coffee',
        status:         'SENT',
        recipientCount: 523,
        sentCount:      518,
        openCount:      287,
        clickCount:     94,
        openRate:       55.4,
        clickRate:      18.1,
        scheduledAt:    new Date(Date.now() - 86400000 * 5).toISOString(),
        sentAt:         new Date(Date.now() - 86400000 * 5).toISOString(),
        createdBy:      'Pim S.',
        createdAt:      new Date(Date.now() - 86400000 * 7).toISOString(),
        tags:           ['vip', 'interested'],
        fromName:       'Somjai Coffee',
        fromEmail:      'hello@somjaicoffee.th',
      },
      {
        id:             'em-002',
        name:           'Corporate fitness packages — BKK Fitness',
        subject:        '💪 Corporate wellness packages — exclusive rates for your team',
        previewText:    'Special corporate pricing available for December sign-ups',
        body:           '<h2>Dear {{name}},</h2><p>We have exciting new corporate packages...</p>',
        clientId:       'client-002',
        clientName:     'BKK Fitness',
        status:         'SCHEDULED',
        recipientCount: 89,
        sentCount:      0,
        openCount:      0,
        clickCount:     0,
        openRate:       null,
        clickRate:      null,
        scheduledAt:    new Date(Date.now() + 86400000 * 2).toISOString(),
        sentAt:         null,
        createdBy:      'Nattawut C.',
        createdAt:      new Date(Date.now() - 3600000 * 2).toISOString(),
        tags:           ['corporate'],
        fromName:       'BKK Fitness',
        fromEmail:      'info@bkkfitness.th',
      },
      {
        id:             'em-003',
        name:           'High season offer — Mango Resort',
        subject:        '🌴 Book now and save 15% — High season at Mango Resort',
        previewText:    'Limited rooms available for December and January',
        body:           '<h2>Dear {{name}},</h2><p>High season is almost here...</p>',
        clientId:       'client-003',
        clientName:     'Mango Resort',
        status:         'DRAFT',
        recipientCount: 0,
        sentCount:      0,
        openCount:      0,
        clickCount:     0,
        openRate:       null,
        clickRate:      null,
        scheduledAt:    null,
        sentAt:         null,
        createdBy:      'Nattawut C.',
        createdAt:      new Date(Date.now() - 3600000).toISOString(),
        tags:           ['vip', 'corporate'],
        fromName:       'Mango Resort',
        fromEmail:      'hello@mangoresort.th',
      },
    ]

    let filtered = allCampaigns
    if (clientId) filtered = filtered.filter((c) => c.clientId === clientId)
    if (status)   filtered = filtered.filter((c) => c.status   === status)

    return HttpResponse.json({
      content:       filtered,
      totalElements: filtered.length,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.post(`${BASE}/api/email-campaigns`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id:             `em-${Date.now()}`,
      ...body,
      status:         body.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      recipientCount: Math.floor(Math.random() * 100) + 20,
      sentCount:      0,
      openCount:      0,
      clickCount:     0,
      openRate:       null,
      clickRate:      null,
      sentAt:         null,
      createdBy:      'Nattawut C.',
      createdAt:      new Date().toISOString(),
    }, { status: 201 })
  }),

  http.delete(`${BASE}/api/email-campaigns/:id`, () => {
    return HttpResponse.json({ message: 'Campaign deleted' })
  }),

  http.post(`${BASE}/api/email-campaigns/:id/send`, async ({ params }) => {
    await new Promise((r) => setTimeout(r, 800))
    return HttpResponse.json({
      id:     params.id,
      status: 'SENDING',
      sentAt: new Date().toISOString(),
    })
  }),
  // ── Bot flows ──────────────────────────────────────────────────
  http.get(`${BASE}/api/flows`, ({ request }) => {
    const url      = new URL(request.url)
    const clientId = url.searchParams.get('clientId') ?? ''
    const status   = url.searchParams.get('status')   ?? ''

    const allFlows = [
      {
        id:          'flow-001',
        name:        'Welcome new customers',
        description: 'Greet new contacts and capture their needs',
        platform:    'FACEBOOK',
        clientId:    'client-001',
        clientName:  'Somjai Coffee',
        status:      'ACTIVE',
        triggerCount: 284,
        completionRate: 72.4,
        createdBy:   'Nattawut C.',
        createdAt:   new Date(Date.now() - 86400000 * 14).toISOString(),
        updatedAt:   new Date(Date.now() - 86400000 * 2).toISOString(),
        nodes: [
          {
            id: 'node-001', type: 'TRIGGER', label: 'First message',
            position: { x: 160, y: 60 },
            data: { triggerType: 'FIRST_MESSAGE', keywords: [] },
            nextNodeId: 'node-002', yesNodeId: null, noNodeId: null,
          },
          {
            id: 'node-002', type: 'MESSAGE', label: 'Welcome message',
            position: { x: 160, y: 200 },
            data: { message: 'Hello! Welcome to Somjai Coffee! 😊 How can we help you today?' },
            nextNodeId: 'node-003', yesNodeId: null, noNodeId: null,
          },
          {
            id: 'node-003', type: 'TAG', label: 'Tag as new lead',
            position: { x: 160, y: 340 },
            data: { tag: 'new', tagAction: 'ADD' },
            nextNodeId: 'node-004', yesNodeId: null, noNodeId: null,
          },
          {
            id: 'node-004', type: 'DELAY', label: 'Wait 1 hour',
            position: { x: 160, y: 480 },
            data: { delayMinutes: 60 },
            nextNodeId: 'node-005', yesNodeId: null, noNodeId: null,
          },
          {
            id: 'node-005', type: 'MESSAGE', label: 'Follow-up offer',
            position: { x: 160, y: 620 },
            data: { message: 'Did you know we have a special promotion today? 15% off for new customers! 🎉' },
            nextNodeId: null, yesNodeId: null, noNodeId: null,
          },
        ],
      },
      {
        id:          'flow-002',
        name:        'FAQ auto-reply',
        description: 'Answer common questions automatically',
        platform:    'LINE',
        clientId:    'client-002',
        clientName:  'BKK Fitness',
        status:      'ACTIVE',
        triggerCount: 156,
        completionRate: 88.1,
        createdBy:   'Pim S.',
        createdAt:   new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt:   new Date(Date.now() - 86400000 * 1).toISOString(),
        nodes: [
          {
            id: 'node-006', type: 'TRIGGER', label: 'Keyword: ราคา',
            position: { x: 160, y: 60 },
            data: { triggerType: 'KEYWORD', keywords: ['ราคา', 'price', 'how much'] },
            nextNodeId: 'node-007', yesNodeId: null, noNodeId: null,
          },
          {
            id: 'node-007', type: 'MESSAGE', label: 'Price info',
            position: { x: 160, y: 200 },
            data: { message: 'Our membership packages start at 990฿/month. Would you like more details?' },
            nextNodeId: 'node-008', yesNodeId: null, noNodeId: null,
          },
          {
            id: 'node-008', type: 'ASSIGN', label: 'Assign to staff',
            position: { x: 160, y: 340 },
            data: { assignTo: 'Pim S.' },
            nextNodeId: null, yesNodeId: null, noNodeId: null,
          },
        ],
      },
      {
        id:          'flow-003',
        name:        'Booking confirmation',
        description: 'Handle room booking inquiries',
        platform:    'WHATSAPP',
        clientId:    'client-003',
        clientName:  'Mango Resort',
        status:      'DRAFT',
        triggerCount: 0,
        completionRate: 0,
        createdBy:   'Nattawut C.',
        createdAt:   new Date(Date.now() - 3600000).toISOString(),
        updatedAt:   new Date(Date.now() - 3600000).toISOString(),
        nodes: [
          {
            id: 'node-009', type: 'TRIGGER', label: 'Keyword: booking',
            position: { x: 160, y: 60 },
            data: { triggerType: 'KEYWORD', keywords: ['book', 'จอง', 'booking'] },
            nextNodeId: 'node-010', yesNodeId: null, noNodeId: null,
          },
          {
            id: 'node-010', type: 'MESSAGE', label: 'Booking info',
            position: { x: 160, y: 200 },
            data: { message: 'Thank you for your interest in Mango Resort! Please share your preferred dates and number of guests.' },
            nextNodeId: null, yesNodeId: null, noNodeId: null,
          },
        ],
      },
    ]

    let filtered = allFlows
    if (clientId) filtered = filtered.filter((f) => f.clientId === clientId)
    if (status)   filtered = filtered.filter((f) => f.status   === status)

    return HttpResponse.json({
      content:       filtered,
      totalElements: filtered.length,
      totalPages:    1,
      page:          0,
      size:          20,
    })
  }),

  http.get(`${BASE}/api/flows/:id`, ({ params }) => {
    return HttpResponse.json({
      id:          params.id,
      name:        'Welcome new customers',
      description: 'Greet new contacts and capture their needs',
      platform:    'FACEBOOK',
      clientId:    'client-001',
      clientName:  'Somjai Coffee',
      status:      'ACTIVE',
      triggerCount: 284,
      completionRate: 72.4,
      createdBy:   'Nattawut C.',
      createdAt:   new Date(Date.now() - 86400000 * 14).toISOString(),
      updatedAt:   new Date(Date.now() - 86400000 * 2).toISOString(),
      nodes: [
        {
          id: 'node-001', type: 'TRIGGER', label: 'First message',
          position: { x: 160, y: 60 },
          data: { triggerType: 'FIRST_MESSAGE', keywords: [] },
          nextNodeId: 'node-002', yesNodeId: null, noNodeId: null,
        },
        {
          id: 'node-002', type: 'MESSAGE', label: 'Welcome message',
          position: { x: 160, y: 200 },
          data: { message: 'Hello! Welcome to Somjai Coffee! 😊' },
          nextNodeId: 'node-003', yesNodeId: null, noNodeId: null,
        },
        {
          id: 'node-003', type: 'TAG', label: 'Tag as new lead',
          position: { x: 160, y: 340 },
          data: { tag: 'new', tagAction: 'ADD' },
          nextNodeId: 'node-004', yesNodeId: null, noNodeId: null,
        },
        {
          id: 'node-004', type: 'DELAY', label: 'Wait 1 hour',
          position: { x: 160, y: 480 },
          data: { delayMinutes: 60 },
          nextNodeId: 'node-005', yesNodeId: null, noNodeId: null,
        },
        {
          id: 'node-005', type: 'MESSAGE', label: 'Follow-up offer',
          position: { x: 160, y: 620 },
          data: { message: 'Did you know we have a special promotion today? 🎉' },
          nextNodeId: null, yesNodeId: null, noNodeId: null,
        },
      ],
    })
  }),

  http.post(`${BASE}/api/flows`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id:          `flow-${Date.now()}`,
      ...body,
      status:      'DRAFT',
      triggerCount: 0,
      completionRate: 0,
      createdBy:   'Nattawut C.',
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      nodes: [
        {
          id:       'node-start',
          type:     'TRIGGER',
          label:    'Trigger',
          position: { x: 160, y: 60 },
          data:     { triggerType: 'KEYWORD', keywords: [] },
          nextNodeId: null, yesNodeId: null, noNodeId: null,
        },
      ],
    }, { status: 201 })
  }),

  http.put(`${BASE}/api/flows/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  }),

  http.patch(`${BASE}/api/flows/:id/status`, async ({ params, request }) => {
    const body = await request.json() as { status: string }
    return HttpResponse.json({ id: params.id, status: body.status })
  }),

  http.delete(`${BASE}/api/flows/:id`, () => {
    return HttpResponse.json({ message: 'Flow deleted' })
  }),
  
 
  http.post(`${BASE}/api/v1/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out' })
  }),
]