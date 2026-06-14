import { useState } from 'react';

export const useWiredSelection = () => {
    const [isSelecting, setIsSelecting] = useState(false);
    const [startTile, setStartTile] = useState<{x: number, y: number} | null>(null);
    // ... lógica para guardar X1, Y1, X2, Y2
    
    return { isSelecting, setIsSelecting, startTile, setStartTile };
}