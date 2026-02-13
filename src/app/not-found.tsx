
import Link from 'next/link';
import { Metadata } from 'next';
// import styles from './not-found.module.css';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: '404 – Neural Route Not Found',
    description: 'The requested page could not be found.',
};

export default function NotFound() {
    return (
        <div className="nf-container">
            <video
                autoPlay
                muted
                loop
                playsInline
                className="nf-videoBackground"
            >
                <source src="/404.webm" type="video/webm" />
                {/* Fallback for browsers that don't support video or the format */}
                Your browser does not support the video tag.
            </video>

            <div className="nf-overlay" />

            <div className="nf-content">
                <h1 className="nf-title">404</h1>
                <h2 className="nf-subtitle">Neural Route Not Found</h2>
                <p className="nf-description">
                    La ruta que buscas no existe en nuestra red neuronal.
                    Puede que haya sido movida o eliminada.
                </p>

                <Link href="/" className={`btn-primary nf-homeButton`}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowLeft size={18} />
                        Regresar al Inicio
                    </span>
                </Link>
            </div>
        </div>
    );
}
