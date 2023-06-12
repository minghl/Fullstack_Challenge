import { db } from "../db.js";

export const getRadars = (req, res) => {
  const q = "SELECT * FROM Radar"

  db.query(q, (err, data) => {
    if (err) return res.status(500).send(err);

    console.log(data, 'data');
    return res.status(200).json(data);
  });
};


export const addRadar = (req, res) => {
  const q =
    "INSERT INTO Radar(`quadrant`, `ring`, `label`, `active`, `moved`,`desc`,`id`,`link`) VALUES (?)";

  console.log(req);
  const values = [
    req.body.quadrant,
    req.body.ring,
    req.body.label,
    req.body.active,
    req.body.moved,
    req.body.desc,
    req.body.id,
    req.body.link,
  ];

  db.query(q, [values], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json("Post has been created.");
  });
  // });
};

export const deleteRadars = (req, res) => {
  const q1 = "DELETE FROM radar_copy";
  const q2 = "insert into radar_copy select * from Radar";
  const q3 = "DELETE FROM Radar";

  db.query(q1, (err, data) => {
    if (err) return res.status(403).json("You cannot delete!");
    return res.json("Radar has been deleted!");
  });
  db.query(q2, (err, data) => {
    if (err) return res.status(403).json("You cannot copy!");
    return res.json("Radar has been copied!");
  });
  db.query(q3, (err, data) => {
    if (err) return res.status(403).json("You cannot delete!");
    return res.json("Radar has been deleted!");
  });
};

export const reloadRadars = (req, res) => {
  const q = "insert into Radar select * from radar_copy";

  db.query(q, (err, data) => {
    if (err) return res.status(403).json("You cannot reload!");
    return res.json("Radar has been reloaded!");
  });
};


