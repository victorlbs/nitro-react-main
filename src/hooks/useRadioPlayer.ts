import { useRef, useState } from 'react';

export const useRadioPlayer = (url: string) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio(url));

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return { isPlaying, togglePlay };
};
