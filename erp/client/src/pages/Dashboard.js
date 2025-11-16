import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  HStack,
  Button,
  useToast,
  Text
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ExpenseManagement from '../components/ExpenseManagement';
import PaymentManagement from '../components/PaymentManagement';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged out successfully',
      status: 'info',
      duration: 2000,
      isClosable: true
    });
    navigate('/login');
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" boxShadow="sm" mb={6}>
        <Container maxW="container.xl" py={4}>
          <HStack justify="space-between">
            <Heading size="lg" color="blue.600">
              MySociety
            </Heading>
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                {user?.username} ({user?.role})
              </Text>
              <Button size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={6}>
        <Tabs colorScheme="blue" isLazy>
          <TabList>
            <Tab>Expense Management</Tab>
            <Tab>Payments</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <ExpenseManagement />
            </TabPanel>
            <TabPanel>
              <PaymentManagement />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
};

export default Dashboard;

