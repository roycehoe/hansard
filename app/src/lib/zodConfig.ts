import { z } from 'zod'

// Zod probes for eval support when it builds its first schema. The site's
// content security policy blocks eval, so skip the probe. This module must be
// the first import in main.tsx, ahead of every module that builds a schema.
z.config({ jitless: true })
