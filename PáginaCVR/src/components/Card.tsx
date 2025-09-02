import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  title: string;
  text: ReactNode; // Cambiamos string | JSX.Element por ReactNode
  image: string;
  imageAlt: string;
}

const Card = ({ title, text, image, imageAlt }: CardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={cardRef} 
      className={`card ${isVisible ? 'visible' : ''}`}
    >
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <img src={image} alt={imageAlt} className="card-image" />
        <div className="card-text">{text}</div> {/* Cambiamos <p> por <div> */}
      </div>
    </div>
  );
};

export default Card;