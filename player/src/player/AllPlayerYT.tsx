import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useNavigate } from 'react-router-dom';
import '../App.css';
//import { Text } from '../ui';
//import {WaNavLink} from '../onkrzyczy'
import {AddWaNavLink} from '../onkrzycz2'
import ConfirmModal from '../ui/ConfirmModal';
import { routes } from "../routes";
import { useAuthContext } from "../Auth/AuthContext";

type PlayerYT = {
  _id: number,
  linkyt: string,
  category: string,
  like: [string],
  unlike: [string],
  countlike: number,
  countunlike: number
}


export const AllPlayerYT = () => {

  const [players, setPlayers] = useState<PlayerYT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthContext();

  useEffect(() => {fetchData();
  }, []);


  const fetchData = async () => {
    try {
      const playerYTResponse = await fetch('http://localhost:5000/player/allPlayers');
      const playerYTData = await playerYTResponse.json();
      if (Array.isArray(playerYTData.data)) {
        setPlayers(playerYTData.data);
      } else {
        console.error('Fetched data is not an array', playerYTData);
      }
      setPlayers(playerYTData.data);
      console.log(playerYTData.data)
      console.log(players)
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  if (loading) {
      return <div>Loading...</div>;
    }


    const handleCategoryClick = (category: string) => {
      setSelectedCategory(category);
    };

    // like handler removed (not used here)

    const filteredPlayers = selectedCategory
      ? players.filter(player => player.category === selectedCategory)
      : players;

    // modal state for confirmation
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

    const openDeleteModal = (id: number) => {
      setPendingDeleteId(id);
      setConfirmOpen(true);
    };

    const doDeletePending = async () => {
      if (pendingDeleteId === null) return;
      const playerId = pendingDeleteId;
      setConfirmOpen(false);
      setPendingDeleteId(null);
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("JWT token not found in localStorage");
        }
        const response = await fetch(`http://localhost:5000/player/delete/${playerId}`, {
          method: "GET",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        });

        const dataa = await response.json();
        if (response.ok) {
          setMessage(`Success: ${dataa.message}`);
          setPlayers(players.filter((player) => player._id !== playerId));
        } else {
          setMessage(`Error: ${dataa.message}`);
        }
      } catch (error) {
        console.error("Error:", error);
        setMessage(`Error: ${(error as Error).message}`);
      }
    };

    const handleOnClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
        const button = event.currentTarget as HTMLButtonElement;
        const playerId = parseInt(button.name, 10); // Convert to number
    
        if (isNaN(playerId)) {
            console.error("Invalid player ID");
            return;
        }
    
        console.log(playerId);
    
        try {
            const token = localStorage.getItem("jwtToken");
            if (!token) {
                throw new Error("JWT token not found in localStorage");
            }
            const response = await fetch(`http://localhost:5000/player/delete/${playerId}`, {
                method: "GET",
                headers: {
                    Authorization: `${token}`,
                    "Content-Type": "application/json",
                },
            });
    
            const dataa = await response.json();
            if (response.ok) {
                setMessage(`Success: ${dataa.message}`);
                setPlayers(players.filter((player) => player._id !== playerId));
            } else {
                setMessage(`Error: ${dataa.message}`);
            }
        } catch (error) {
            console.error("Error:", error);
            setMessage(`Error: ${(error as Error).message}`);
        }
    };

      // const handleOnClick = async (event: { target: { name: number; }; }) => {
      //   console.log(event.target.name);
      //   try {
      //     const token = localStorage.getItem('jwtToken');
      //       if (!token) {
      //           throw new Error('JWT token not found in localStorage');
      //       }
      //     const response = await fetch(`http://localhost:5000/player/delete/${event.target.name}`, {
      //       method: 'GET',
      //       headers: {
      //         'Authorization': `${token}`,
      //         'Content-Type': 'application/json',
      //       },
      //     });
      //     const dataa = await response.json();
      //     if (response.ok) {
      //       setMessage(`Success: ${dataa.message}`);
      //       setPlayers(players.filter(player => player._id !== event.target.name));
      //     } else {
      //       setMessage(`Error: ${dataa.message}`);
      //     }
      //   } catch (error) {
      //     console.error('Error:', error);
      //     setMessage(`Error: ${(error as Error).message}`);
      //   }
      // };


      const handleOnClickUpdate1 = (id: number) => {
        const token = localStorage.getItem('jwtToken');
            if (!token) {
                throw new Error('JWT token not found in localStorage');
            }
        navigate(`/update/${id}`);
        console.log(id);
      };


      return (
        <div>
          <div className="button-container">
            <button className="custom-button focus:outline-none focus:ring-4 focus:ring-blue-100" onClick={() => handleCategoryClick('POP')}>POP</button>
            <button className="custom-button focus:outline-none focus:ring-4 focus:ring-blue-100" onClick={() => handleCategoryClick('RAP')}>RAP</button>
            <button className="custom-button focus:outline-none focus:ring-4 focus:ring-blue-100" onClick={() => handleCategoryClick('INDIE')}>INDIE</button>
            <button className="custom-button focus:outline-none focus:ring-4 focus:ring-blue-100" onClick={() => handleCategoryClick('METAL')}>METAL</button>
            <button className="custom-button focus:outline-none focus:ring-4 focus:ring-blue-100" onClick={() => handleCategoryClick('ROCK')}>ROCK</button>
            <button className="custom-button focus:outline-none focus:ring-4 focus:ring-blue-100" onClick={() => handleCategoryClick('')}>All</button>
            {isLoggedIn ? (<><AddWaNavLink to={routes.ADDPLAYER.path} className="custom-button text-white hover:text-white bg-green-900 hover:bg-green-700">Add</AddWaNavLink></>):(<></>)}
            </div>
            {isLoggedIn ? (<>
          <div className="player-grid">
            {filteredPlayers.map((player) => (
              <div className="player-wrapper" key={player._id}>
              <div>
                <ReactPlayer
                  className="react-player"
                  url={player.linkyt}
                  width="100%"
                  height="100%"
                  controls
                />
              </div>
              <button onClick={() => handleOnClickUpdate1(player._id)} className='h-10 w-30 bg-green-500 hover:bg-green-300 mr-2'>Update</button>
              <button name={String(player._id)} onClick={() => openDeleteModal(player._id)}  className='h-10 w-30 bg-red-400 hover:bg-red-200'>Delete</button>
              </div>
            ))}
          </div>
          </>):(<></>)}
          {message && <p className="dark:text-green-200">{message}</p>}
          <ConfirmModal
            open={confirmOpen}
            message={"Czy na pewno chcesz usunąć ten wpis?"}
            onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
            onConfirm={doDeletePending}
          />
        </div>
      );
      
  }