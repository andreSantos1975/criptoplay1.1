'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Camera, Loader2 } from 'lucide-react';
import styles from './ProfileComponents.module.css';

interface ProfileHeaderProps {
  name: string;
  memberSince: string;
  image?: string | null;
}

const ProfileHeader = ({ name, memberSince, image }: ProfileHeaderProps) => {
  const { update } = useSession();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const initial = name.charAt(0).toUpperCase();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange foi acionado.');
    console.log('Conteúdo de event.target.files:', event.target.files);

    const file = event.target.files?.[0];
    if (!file) {
      console.log('Nenhum arquivo encontrado em event.target.files. Abortando.');
      return;
    }

    console.log('Arquivo selecionado:', file.name);
    setIsUploading(true);
    const uploadToast = toast.loading('Enviando sua nova foto...');

    try {
      const response = await fetch(`/api/avatar/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        throw new Error('Falha no upload da imagem.');
      }

      const newBlob = await response.json();
      
      // A API agora atualiza o banco de dados, então só precisamos atualizar a sessão
      await update({ image: newBlob.url });

      toast.success('Avatar atualizado com sucesso!', { id: uploadToast });

    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro.', { id: uploadToast });
    } finally {
      setIsUploading(false);
      // Removed: inputFileRef.current.value = ""; to avoid "No file chosen" message after successful upload.
    }
  };

  return (
    <div className={styles.profileCard}>
      <h2 className={styles.title}>Meu Perfil</h2>

      <div style={{ marginBottom: '1rem' }}>
        <h3 className={styles.text} style={{ fontSize: '1.125rem', fontWeight: 600 }}>{name}</h3>
        <p className={styles.mutedText}>Membro desde {memberSince}</p>
      </div>
      
      <div className={styles.flexCenter}>
        <label htmlFor="avatar-upload" className={styles.avatarContainer} style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}>
          {image ? (
            <Image
              src={image}
              alt={name}
              width={64}
              height={64}
              className={styles.avatarImage}
            />
          ) : (
            <div className={styles.avatarCircle}>
              {initial}
            </div>
          )}
          <div className={styles.avatarOverlay}>
            {isUploading ? <Loader2 className="animate-spin" /> : <Camera />}
          </div>
        </label>
        <input
          type="file"
          id="avatar-upload"
          ref={inputFileRef} // Manter a ref para resetar o valor
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/gif"
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default ProfileHeader;
