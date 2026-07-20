// ================================================================
// INFRASTRUCTURE SEED: Stops
// ================================================================
// Purpose: Create bus stops across Addis Ababa
// Dependency: 05-terminals.seed.ts
// Tables: Stop
//
// 13 of these 22 stops have coordinates VERIFIED against Google
// Places (July 2026) — see inline comments. The remaining ones
// (Bole Toyota, Megenagna Africa, Merkato Shera, St. Michael Church,
// Kality Industrial, Lebanon) don't correspond to independently
// findable places and are still estimates — TODO if you need them
// to be exact. STOP-CMC-02 keeps its original grouping even though
// its real coordinates (Ayat) are ~8 km from STOP-CMC-01's real
// coordinates; re-grouping would change route topology, so that's
// left as a follow-up rather than done silently here.
// ================================================================

import { PrismaClient } from '@prisma/client';

const STOPS = [
  // Bole Area (Terminal: TERM-BOLE)
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-BOLE-01', name: 'Bole Terminal', lat: 8.9838, lng: 38.7963, zone: 'Zone A', landmark: 'Bole International Airport Road', terminal: 'TERM-BOLE' },
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-BOLE-02', name: 'Bole Medhanealem', lat: 8.9959, lng: 38.7899, zone: 'Zone A', landmark: 'Medhanealem Church', terminal: 'TERM-BOLE' },
  { code: 'STOP-BOLE-03', name: 'Bole Toyota', lat: 9.0089, lng: 38.7989, zone: 'Zone A', landmark: 'Toyota Showroom', terminal: 'TERM-BOLE' },
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-BOLE-04', name: 'Bole Ambassador', lat: 8.992, lng: 38.7882, zone: 'Zone A', landmark: 'Ambassador Hotel', terminal: 'TERM-BOLE' },
  
  // Megenagna Area (Terminal: TERM-MEG)
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-MEG-01', name: 'Megenagna Terminal', lat: 9.0198, lng: 38.8018, zone: 'Zone C', landmark: 'Megenagna Roundabout', terminal: 'TERM-MEG' },
  { code: 'STOP-MEG-02', name: 'Megenagna Africa', lat: 9.0289, lng: 38.7767, zone: 'Zone C', landmark: 'Africa Avenue', terminal: 'TERM-MEG' },
  // VERIFIED coords, but real location is in Bole, not Megenagna
  { code: 'STOP-MEG-03', name: 'Hayat Hospital', lat: 8.9946, lng: 38.7951, zone: 'Zone C', landmark: 'Hayat Hospital', terminal: 'TERM-MEG' },
  
  // Piassa Area (Terminal: TERM-PIA)
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-PIA-01', name: 'Piassa Square', lat: 9.0372, lng: 38.7551, zone: 'Zone D', landmark: 'Piassa Square', terminal: 'TERM-PIA' },
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-PIA-02', name: 'Meskel Square', lat: 9.0105, lng: 38.7611, zone: 'Zone D', landmark: 'Meskel Square', terminal: 'TERM-PIA' },
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-PIA-03', name: 'St. George Cathedral', lat: 9.0368, lng: 38.7513, zone: 'Zone D', landmark: 'St. George Cathedral', terminal: 'TERM-PIA' },
  
  // Merkato Area (Terminal: TERM-MER)
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-MER-01', name: 'Merkato Terminal', lat: 9.033, lng: 38.7379, zone: 'Zone D', landmark: 'Merkato Main Gate', terminal: 'TERM-MER' },
  { code: 'STOP-MER-02', name: 'Merkato Shera', lat: 9.0034, lng: 38.7267, zone: 'Zone D', landmark: 'Merkato Shera', terminal: 'TERM-MER' },
  { code: 'STOP-MER-03', name: 'St. Michael Church', lat: 9.0123, lng: 38.7289, zone: 'Zone D', landmark: 'St. Michael Church', terminal: 'TERM-MER' },
  
  // CMC Area (Terminal: TERM-CMC)
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-CMC-01', name: 'CMC Interchange', lat: 9.0255, lng: 38.8544, zone: 'Zone B', landmark: 'CMC Main Gate', terminal: 'TERM-CMC' },
  // VERIFIED coords, but real Ayat coords, but ~8km from real CMC-01 above
  { code: 'STOP-CMC-02', name: 'CMC Ayat', lat: 9.0155, lng: 38.7871, zone: 'Zone B', landmark: 'Ayat Village', terminal: 'TERM-CMC' },
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-CMC-03', name: 'Gurd Shola', lat: 9.019, lng: 38.8172, zone: 'Zone B', landmark: 'Gurd Shola', terminal: 'TERM-CMC' },
  
  // Kality Area (Terminal: TERM-KAL)
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-KAL-01', name: 'Kality Terminal', lat: 8.9344, lng: 38.7654, zone: 'Zone D', landmark: 'Kality Interchange', terminal: 'TERM-KAL' },
  { code: 'STOP-KAL-02', name: 'Kality Industrial', lat: 8.9789, lng: 38.7389, zone: 'Zone D', landmark: 'Industrial Area', terminal: 'TERM-KAL' },
  
  // Other Major Stops (No Terminal)
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-SAR-01', name: 'Saris Interchange', lat: 8.9448, lng: 38.7695, zone: 'Zone E', landmark: 'Saris Roundabout', terminal: null },
  { code: 'STOP-LEB-01', name: 'Lebanon', lat: 9.0234, lng: 38.7689, zone: 'Zone E', landmark: 'Lebanon Area', terminal: null },
  // VERIFIED — Google Places, July 2026
  { code: 'STOP-KAZ-01', name: 'Kazanchis', lat: 9.0166, lng: 38.7761, zone: 'Zone B', landmark: 'Kazanchis Business District', terminal: null },
  // VERIFIED coords, but approximated to Akaki Beseka town center
  { code: 'STOP-AKAKI-01', name: 'Akaki Interchange', lat: 8.856, lng: 38.7859, zone: 'Zone F', landmark: 'Akaki Interchange', terminal: null },
];

export async function seedStops(prisma: PrismaClient) {
  console.log('🚏 Creating Stops...');

  const terminals = await prisma.terminal.findMany();
  const terminalMap = Object.fromEntries(terminals.map(t => [t.terminal_code, t.id]));

  let created = 0;
  for (const s of STOPS) {
    const terminalId = s.terminal ? terminalMap[s.terminal] : null;
    try {
      await prisma.stop.create({
        data: {
          terminal_id: terminalId,
          stop_code: s.code,
          stop_name: s.name,
          latitude: s.lat,
          longitude: s.lng,
          address: s.landmark ? `${s.name}, ${s.landmark}` : s.name,
          landmark: s.landmark,
          zone: s.zone,
          status: 'ACTIVE',
        },
      });
      created++;
    } catch (error) {
      console.warn(`   ⚠️ Could not create stop ${s.code}: ${error}`);
    }
  }

  console.log(`✅ ${created} stops created`);
}