import type { ReactNode } from "react";
import './ExperienceCard.css'

interface ExperienceCardProps {
  image: string
  imageAlt: string
  title: string
  subtitle: string
  text: ReactNode // Permite string, JSX.Element, listas, etc.
}


const ExperienceCard: React.FC<ExperienceCardProps> = ({ image, imageAlt, title, subtitle, text }) => {
     console.log("Texto recibido en ExperienceCard:", text)
  return (
    <div className="experience-card">
      <div className="experience-image-container">
        <img src={image} alt={imageAlt} className="experience-image" />
      </div>
      <div className="experience-content">
        <h3 className="experience-title">{title}</h3>
        <h4 className="experience-subtitle">{subtitle}</h4>
        <p className="experience-text">{text}</p>


      </div>
    </div>
  )
}

export default ExperienceCard
