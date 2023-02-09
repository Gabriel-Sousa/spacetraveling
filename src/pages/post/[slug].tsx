import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { asHTML, asText } from '@prismicio/helpers';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Head from 'next/head';


interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter()

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    const headingTime = contentItem.heading.split(/\s+/).length;
    const wordsTime = asText(contentItem.body).split(/\s+/).length;

    return total + headingTime + wordsTime;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <Header />
      <img src={post.data.banner.url} alt="Banner" className={styles.banner} />
      <main className={commonStyles.container}>
        <div className={styles.postTop}>
          <h1>{post.data.title}</h1>
          <ul>
            <li>
              <FiCalendar />
              {formattedDate}
            </li>
            <li>
              <FiUser />
              {post.data.author}
            </li>
            <li>
              <FiClock />
              {`${readTime} min`}
              {/* {post.first_publication_date} */}
            </li>
          </ul>

          {post.data.content.map(content => {
            return (
              <article key={content.heading}>
                <h1>{content.heading}</h1>
                <div className={styles.post} dangerouslySetInnerHTML={{ __html: asHTML(content.body) }} />
              </article>
            )
          })}
        </div>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid }
    }
  })


  return {
    paths,
    fallback: 'blocking'
  }

};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug));

  return {
    props: {
      post: response
    },
    revalidate: 60 // 60 seconds
  }
};
