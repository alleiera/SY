import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const ClockDisplay = () => {
    const [time, setTime] = useState(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return <><Clock size={12} /> {time}</>;
};

export default ClockDisplay;
