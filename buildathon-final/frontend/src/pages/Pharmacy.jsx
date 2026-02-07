import React from 'react';
import { motion } from 'framer-motion';

const Pharmacy = () => {
    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}
        >
            <motion.h2
                variants={item}
                style={{ color: 'var(--color-primary)', marginBottom: '1.5rem', fontSize: '1.5rem' }}
            >
                Pharmacy
            </motion.h2>

            <motion.div variants={item} style={{
                backgroundColor: 'white',
                padding: '3rem',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <p style={{ color: '#666', fontSize: '1.1rem' }}>Order medicines and health products.</p>
                <div style={{ marginTop: '1rem', color: 'var(--color-secondary)' }}>Coming Soon</div>
            </motion.div>
        </motion.div>
    );
};

export default Pharmacy;
