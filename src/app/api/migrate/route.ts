import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  animeData, 
  mangaData, 
  characterData 
} from '@/data';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // --- 1. ANIME TRANSFORMATION ---
    const animeRows = animeData.map((a: any) => ({
      title: a.title,
      detail: a.detail || a.sub || "",
      season: a.season,
      episode_number: typeof a.episodeNumber === 'number' ? a.episodeNumber : 0,
      type: a.type,
      theme: a.theme,
      video_url: a.videoUrl,
      subtitles: a.subtitles || null 
    }));

    // --- 2. MANGA TRANSFORMATION ---
    const mangaRows = mangaData.map((m: any) => ({
      id: String(m.id), // DIRECTLY use the ID as string ("1", "sb1", "t1")
      chapter_display_number: String(m.id), // For sorting/display
      title: m.title,
      detail: m.detail,
      type: m.type,
      theme: m.theme || 'white',
      image_urls: m.imageUrls || [] 
    }));

    // --- 3. CHARACTER TRANSFORMATION ---
    const charRows = characterData.map((c: any) => {
      const studentName = c.student?.name || c.name || "Unknown";
      const heroName = c.hero?.name || c.heroName || "Unknown";
      
      return {
        id: c.id,
        name: studentName,
        hero_name: heroName,
        rarity: c.rarity,
        type: c.type,
        quirk: c.quirk,
        
        stat_power: c.stats?.power || 0,
        stat_speed: c.stats?.speed || 0,
        stat_technique: c.stats?.technique || 0,
        stat_intelligence: c.stats?.intelligence || 0,
        stat_aura: c.stats?.aura || 0,

        height: c.bio?.height || "",
        birthday: c.bio?.birthday || "",
        blood_type: c.bio?.bloodType || "",
        affiliation: c.affiliation || "U.A. High",

        colors: c.colors,
        images: c.images,
        student_profile: c.student,
        hero_profile: c.hero
      };
    });

    // --- EXECUTE INSERTS ---
    
    // A. Clear tables
    // For anime, ID is auto-incrementing int, so neq(-1) deletes all.
    await supabase.from('anime_episodes').delete().neq('id', -1);
    // For manga and characters, ID is text, so neq('dummy') deletes all.
    await supabase.from('manga_chapters').delete().neq('id', 'dummy_delete_all');
    await supabase.from('characters').delete().neq('id', 'dummy_delete_all');
    
    // B. Insert Anime
    const { error: animeError } = await supabase.from('anime_episodes').insert(animeRows);
    if (animeError) console.error('Anime Insert Error:', animeError);

    // C. Insert Manga
    const { error: mangaError } = await supabase.from('manga_chapters').insert(mangaRows);
    if (mangaError) console.error('Manga Insert Error:', mangaError);

    // D. Insert Characters
    const { error: charError } = await supabase.from('characters').insert(charRows);
    if (charError) console.error('Char Insert Error:', charError);

    if (animeError || mangaError || charError) {
        return NextResponse.json({ success: false, message: "Partial failure, check console logs" }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        message: `Migrated ${animeRows.length} Episodes, ${mangaRows.length} Chapters, ${charRows.length} Characters` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}