import React, { useEffect } from 'react';
import { useParams } from 'wouter';

interface PostRedirectProps {
  from: string;
  to: string;
}

const PostRedirect: React.FC<PostRedirectProps> = ({ from, to }) => {
  useEffect(() => {
    console.log(`Redirecionando de ${from} para ${to}`);
    window.location.href = to;
  }, [from, to]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
};

export default PostRedirect;