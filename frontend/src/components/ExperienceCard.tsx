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
  return (
   <div className="experience-card">
  <div className="experience-image-container">
    <img src={image} alt={imageAlt} className="experience-image" />
  </div>
  <div className="experience-content">
    <h3 className="experience-title">{title}</h3>
    {/* Tooltip inline para móvil/tablet (debajo de la imagen, encima del subtitulo) */}
    <div className="experience-tooltip-inline">
      {text}
    </div>
    <h4 className="experience-subtitle">{subtitle}</h4>

    {/* Tooltip/burbuja */}
    <div className="experience-tooltip">
      {text}
    </div>
  </div>
</div>

  )
}

export default ExperienceCard
