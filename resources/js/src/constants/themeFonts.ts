export interface ThemeFont {
    label: string;
    value: string;
    category?: 'khmer' | 'sans' | 'serif' | 'display';
}

export const THEME_FONTS: ThemeFont[] = [
    { label: 'Google Sans (Default)', value: '"Google Sans", sans-serif', category: 'khmer' },
    { label: 'Arial / Arimo', value: 'Arimo, Arial, sans-serif', category: 'sans' },
    { label: 'Inter Khmer', value: 'Inter Khmer, sans-serif', category: 'khmer' },
    { label: 'Inter (Enterprise)', value: 'Inter, sans-serif', category: 'sans' },
    { label: 'Outfit (Modern)', value: 'Outfit, sans-serif', category: 'sans' },
    { label: 'Public Sans', value: '"Public Sans", sans-serif', category: 'sans' },
    { label: 'Krasar (Premium)', value: 'Krasar, sans-serif', category: 'khmer' },
    { label: 'Khmer OS Battambang', value: '"Khmer OS Battambang", sans-serif', category: 'khmer' },
    { label: 'Kantumruy Pro', value: '"Kantumruy Pro", sans-serif', category: 'khmer' },
    { label: 'Hanuman (Serif)', value: 'Hanuman, serif', category: 'serif' },
    { label: 'Dangrek', value: 'Dangrek, sans-serif', category: 'khmer' },
    { label: 'Poppins', value: 'Poppins, sans-serif', category: 'sans' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif', category: 'sans' },
    { label: 'DM Sans', value: '"DM Sans", sans-serif', category: 'sans' },
    { label: 'Roboto', value: 'Roboto, sans-serif', category: 'sans' },
    { label: 'Ubuntu', value: 'Ubuntu, sans-serif', category: 'sans' },
    { label: 'Nunito', value: 'Nunito, sans-serif', category: 'sans' },
    { label: 'System UI', value: 'system-ui, sans-serif', category: 'sans' },
];
export const getCanonicalFont = (value: string | undefined) => {
    if (!value) return THEME_FONTS[0];
    
    // Exact match
    const exact = THEME_FONTS.find(f => f.value === value);
    if (exact) return exact;
    
    // Fuzzy match for legacy values
    const fuzzy = THEME_FONTS.find(f => 
        f.value.toLowerCase().includes(value.toLowerCase()) || 
        value.toLowerCase().includes(f.label.toLowerCase())
    );
    
    return fuzzy || THEME_FONTS[0];
};
