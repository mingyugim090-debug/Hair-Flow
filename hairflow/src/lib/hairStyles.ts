// 헤어스타일 카탈로그 - 남성/여성 전체 스타일
export interface HairStyleOption {
    id: string;
    name: string;
    nameEn: string; // 이미지 생성용 영문 프롬프트
    category: '숏' | '미디엄' | '롱' | '펌' | '언더컷';
    gender: 'M' | 'F' | 'U'; // U = 유니섹스
    description: string; // 한 줄 설명
}

export const HAIR_STYLE_CATALOG: HairStyleOption[] = [
    // ─── 남성 숏 ───
    { id: 'crew-cut', name: '크루컷', nameEn: 'Classic crew cut, short sides tapered, slightly longer on top, clean natural finish', category: '숏', gender: 'M', description: '짧고 깔끔한 클래식 스타일' },
    { id: 'buzz-cut', name: '버즈컷', nameEn: 'Buzz cut, very short uniform length all around, clean and minimal', category: '숏', gender: 'M', description: '초단발 밀리터리 스타일' },
    { id: 'ivy-league', name: '아이비리그컷', nameEn: 'Ivy league cut, short back and sides, slightly longer top with side part, preppy clean look', category: '숏', gender: 'M', description: '사이드 파트가 있는 단정한 스타일' },
    { id: 'caesar-cut', name: '시저컷', nameEn: 'Caesar cut, short horizontal bangs, uniform short length, textured top', category: '숏', gender: 'M', description: '짧은 앞머리의 로마 스타일' },
    { id: 'crop-top', name: '크롭탑', nameEn: 'Textured crop top, short sides, messy textured fringe on top, modern casual finish', category: '숏', gender: 'M', description: '텍스처드 프린지 크롭' },
    { id: 'short-quiff', name: '숏 퀴프', nameEn: 'Short quiff hairstyle, volume at front swept upward, tapered sides, polished finish', category: '숏', gender: 'M', description: '앞머리에 볼륨감을 준 스타일' },
    { id: 'french-crop', name: '프렌치 크롭', nameEn: 'French crop, textured short fringe, clean fade on sides, natural matte finish', category: '숏', gender: 'M', description: '짧은 텍스처 프린지 크롭' },

    // ─── 남성 미디엄 ───
    { id: 'two-block', name: '투블럭컷', nameEn: 'Korean two-block cut, undercut sides shaved clean, long top falling naturally, dark hair, sleek modern look', category: '미디엄', gender: 'M', description: '옆·뒷머리 밀착, 윗머리 길게' },
    { id: 'comma-hair', name: '가르마펌 (쉼표머리)', nameEn: 'Korean comma hair, center or side part, bangs curled inward like comma shape, medium length, natural volume', category: '미디엄', gender: 'M', description: '쉼표 모양 앞머리 가르마' },
    { id: 'dandy-cut', name: '댄디컷', nameEn: 'Dandy cut, neat medium length, side part, layered back, polished professional finish', category: '미디엄', gender: 'M', description: '깔끔한 비즈니스 스타일' },
    { id: 'pompadour', name: '포마드/폼파두르', nameEn: 'Classic pompadour, swept back voluminous top, tight sides, glossy slick finish', category: '미디엄', gender: 'M', description: '볼륨 있게 뒤로 넘긴 클래식' },
    { id: 'slick-back', name: '슬릭백', nameEn: 'Slick back hairstyle, all hair combed back smoothly, medium length, wet look finish', category: '미디엄', gender: 'M', description: '올백으로 넘긴 젤 스타일' },
    { id: 'textured-mid', name: '텍스처드 미디엄', nameEn: 'Textured medium length layered cut, natural movement, piece-y finish, effortless casual style', category: '미디엄', gender: 'M', description: '자연스러운 레이어드 미디엄' },
    { id: 'curtain-bangs-m', name: '커튼뱅 (남성)', nameEn: 'Curtain bangs men, center parted medium length, soft framing layers around face, relaxed natural finish', category: '미디엄', gender: 'M', description: '가운데 가르마 커튼 앞머리' },
    { id: 'wolf-cut-m', name: '울프컷 (남성)', nameEn: 'Mens wolf cut, shaggy layered mullet style, textured top, longer back and sides, messy edgy look', category: '미디엄', gender: 'M', description: '레이어드 멀릿 울프' },
    { id: 'middle-part', name: '미들파트', nameEn: 'Middle part hairstyle, center parted medium length dark hair, clean sides, soft natural volume', category: '미디엄', gender: 'M', description: '정가운데 가르마 스타일' },

    // ─── 남성 롱 ───
    { id: 'long-layered-m', name: '롱 레이어드 (남성)', nameEn: 'Mens long layered hair, shoulder length, soft layers, natural texture, dark hair flowing freely', category: '롱', gender: 'M', description: '어깨까지 내려오는 레이어드' },
    { id: 'man-bun', name: '맨번', nameEn: 'Man bun hairstyle, long hair tied up in neat bun on top, some loose strands, clean undercut sides', category: '롱', gender: 'M', description: '긴 머리를 올려 묶은 번 스타일' },

    // ─── 남성 펌 ───
    { id: 'down-perm', name: '다운펌', nameEn: 'Korean down perm, hair straightened and pressed down flat, neat smooth finish, natural dark hair', category: '펌', gender: 'M', description: '볼륨 눌러 밀착시킨 매직' },
    { id: 'setting-perm', name: '셋팅펌', nameEn: 'Korean setting perm, soft natural waves, medium length, volume at roots, S-curl pattern', category: '펌', gender: 'M', description: '뿌리 볼륨 + 자연스러운 웨이브' },
    { id: 'screw-perm', name: '스크류펌', nameEn: 'Screw perm, tight spiral curls all over, medium length, voluminous textured curly hair', category: '펌', gender: 'M', description: '촘촘한 스파이럴 컬' },
    { id: 'body-perm-m', name: '바디펌 (남성)', nameEn: 'Mens body perm, loose large waves, natural volume, medium length, relaxed wavy finish', category: '펌', gender: 'M', description: '크고 자연스러운 웨이브' },
    { id: 'afro-perm', name: '아프로펌', nameEn: 'Afro perm, voluminous tight curls, round shape, big curly hair, retro style', category: '펌', gender: 'M', description: '풍성한 아프로 스타일' },

    // ─── 남성 언더컷 ───
    { id: 'undercut-classic', name: '클래식 언더컷', nameEn: 'Classic undercut, shaved sides and back, long slicked top, sharp disconnected look', category: '언더컷', gender: 'M', description: '옆·뒤 면 밀고 윗머리 길게' },
    { id: 'fade-low', name: '로우 페이드', nameEn: 'Low fade haircut, gradual taper starting low near ears, longer top, clean blend', category: '언더컷', gender: 'M', description: '귀 주변부터 서서히 페이드' },
    { id: 'fade-mid', name: '미드 페이드', nameEn: 'Mid fade haircut, fade starting at temple line, textured top, modern clean look', category: '언더컷', gender: 'M', description: '관자놀이 높이 페이드' },
    { id: 'fade-high', name: '하이 페이드', nameEn: 'High fade haircut, aggressive fade starting high, short top with texture, sharp contrast', category: '언더컷', gender: 'M', description: '높은 위치의 강한 페이드' },
    { id: 'skin-fade', name: '스킨 페이드', nameEn: 'Skin fade, gradual taper down to skin, clean sharp look, textured top', category: '언더컷', gender: 'M', description: '피부까지 깎는 극강 페이드' },
    { id: 'mohawk-fade', name: '모히칸 페이드', nameEn: 'Mohawk fade, strip of longer hair on top center, faded sides, edgy bold look', category: '언더컷', gender: 'M', description: '가운데만 남긴 모히칸' },

    // ─── 여성 숏 ───
    { id: 'pixie-cut', name: '픽시컷', nameEn: 'Pixie cut, very short cropped hair, textured layers, feminine and edgy, light wispy bangs', category: '숏', gender: 'F', description: '짧고 가벼운 여성 숏컷' },
    { id: 'short-bob', name: '숏보브', nameEn: 'Short bob cut, chin length, blunt ends, sleek straight finish, clean lines', category: '숏', gender: 'F', description: '턱 선까지의 단발보브' },
    { id: 'shaggy-short', name: '샤기 숏', nameEn: 'Shaggy short haircut, choppy textured layers, messy effortless finish, fringe bangs', category: '숏', gender: 'F', description: '텍스처 가득한 숏 레이어드' },
    { id: 'hush-cut', name: '허쉬컷', nameEn: 'Hush cut, soft layered short to medium cut, face-framing layers, wispy light texture, Korean style', category: '숏', gender: 'F', description: '가벼운 레이어드 허쉬컷' },

    // ─── 여성 미디엄 ───
    { id: 'lob-cut', name: '로브 (롱보브)', nameEn: 'Lob haircut, shoulder length bob, blunt or soft layers, natural straight or slight bend at ends', category: '미디엄', gender: 'F', description: '어깨 길이 롱보브' },
    { id: 'curtain-bangs-f', name: '커튼뱅', nameEn: 'Curtain bangs, center-parted feathery bangs framing face, medium length layered hair, soft romantic look', category: '미디엄', gender: 'F', description: '얼굴을 감싸는 커튼형 앞머리' },
    { id: 'layer-cut-f', name: '레이어드컷', nameEn: 'Layered haircut, medium to long length, face-framing layers, movement and volume, natural bounce', category: '미디엄', gender: 'F', description: '얼굴을 감싸는 레이어드' },
    { id: 'wolf-cut-f', name: '울프컷 (여성)', nameEn: 'Womens wolf cut, shaggy layered mullet, voluminous top, wispy thin ends, edgy trendy look', category: '미디엄', gender: 'F', description: '볼륨 있는 울프 레이어드' },
    { id: 'c-curl', name: 'C컬', nameEn: 'C-curl ends, medium length hair, ends curled inward in C shape, sleek and feminine, polished look', category: '미디엄', gender: 'F', description: '안으로 말린 C자 끝처리' },

    // ─── 여성 롱 ───
    { id: 'long-straight', name: '롱 스트레이트', nameEn: 'Long straight hair, sleek smooth very long hair past shoulders, shiny glossy finish, dark hair', category: '롱', gender: 'F', description: '길고 매끈한 생머리' },
    { id: 'long-layered-f', name: '롱 레이어드', nameEn: 'Long layered hair, cascading face-framing layers, natural movement, flowing soft texture', category: '롱', gender: 'F', description: '자연스러운 긴 레이어드' },
    { id: 'hippie-perm', name: '히피펌', nameEn: 'Hippie perm, loose bohemian waves, long flowing curls, natural effortless wavy texture', category: '롱', gender: 'F', description: '보헤미안 웨이브 롱 펌' },
    { id: 'goddess-wave', name: '여신 웨이브', nameEn: 'Goddess wave, large voluminous S-waves, long glamorous hair, shiny bouncy curls', category: '롱', gender: 'F', description: '볼륨감 있는 S자 웨이브' },

    // ─── 여성 펌 ───
    { id: 'body-perm-f', name: '바디펌', nameEn: 'Body perm, loose large soft waves throughout, natural volume, medium to long length, bouncy finish', category: '펌', gender: 'F', description: '크고 부드러운 웨이브 펌' },
    { id: 'glam-perm', name: '글램펌', nameEn: 'Glam perm, tight defined curls, voluminous glamorous curly hair, bouncy ringlets', category: '펌', gender: 'F', description: '촘촘한 글래머러스 컬' },
    { id: 'digital-perm', name: '디지털펌', nameEn: 'Digital perm, defined bouncy curls starting from mid-length, natural volume, S or J shaped curls', category: '펌', gender: 'F', description: '선명한 컬의 디지털펌' },
    { id: 'root-perm', name: '뿌리펌', nameEn: 'Root perm, volume only at roots, rest of hair straight or slightly wavy, natural lift at top', category: '펌', gender: 'F', description: '뿌리에만 볼륨을 주는 펌' },
    { id: 'air-perm', name: '에어펌', nameEn: 'Air perm, soft airy loose waves, lightweight natural texture, feathery finish, effortless volume', category: '펌', gender: 'F', description: '가볍고 자연스러운 에어 웨이브' },
];

// 카테고리별 그룹핑 유틸
export function getStylesByCategory(gender?: 'M' | 'F') {
    const filtered = gender
        ? HAIR_STYLE_CATALOG.filter(s => s.gender === gender || s.gender === 'U')
        : HAIR_STYLE_CATALOG;

    const categories = ['숏', '미디엄', '롱', '펌', '언더컷'] as const;
    return categories.map(cat => ({
        category: cat,
        styles: filtered.filter(s => s.category === cat),
    })).filter(g => g.styles.length > 0);
}
